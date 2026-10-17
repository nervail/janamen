#!/usr/bin/env bash
# Сброс демо-данных и прогон основных сценариев. Запуск: ./scripts/smoke.sh
cd "$(dirname "$0")/.."
A=./scripts/api.sh
OK=0; BAD=0

# check "описание" <ожидаемый HTTP> "<подстрока в ответе или пусто>" команда...
check() {
  local desc=$1 code=$2 needle=$3; shift 3
  local out got
  out=$("$@" 2>&1)
  got=$(echo "$out" | head -1 | awk '{print $2}')
  if [ "$got" = "$code" ] && { [ -z "$needle" ] || echo "$out" | grep -q -- "$needle"; }; then
    echo "✔ $desc"; OK=$((OK+1))
  else
    echo "✘ $desc  (ожидали HTTP $code и '$needle', получили HTTP $got)"
    echo "$out" | head -25 | sed 's/^/    /'
    BAD=$((BAD+1))
  fi
}

health() {
  local c; c=$(curl -s -o /tmp/health.out -w '%{http_code}' http://localhost:8080/api/health)
  echo "HTTP $c"; cat /tmp/health.out
}

anon_me() {
  local c; c=$(curl -s -o /tmp/anon.out -w '%{http_code}' -H Accept:application/json http://localhost:8080/api/v1/me)
  echo "HTTP $c"; cat /tmp/anon.out
}

# JSON ответов на тест главы: $1 = id главы, $2 = true (верные варианты) или false (неверные)
quiz_body() {
  docker compose exec -T db psql -U janamen -d janamen -tA -F, -c \
    "select distinct on (q.id) q.id, o.id from questions q join options o on o.question_id = q.id where q.chapter_id = $1 and o.is_correct = $2 order by q.id, o.position" \
  | awk -F, 'BEGIN{printf "{\"answers\":["} {printf "%s{\"question_id\":%s,\"option_id\":%s}", (NR>1?",":""), $1, $2} END{print "]}"}'
}

# count "описание" "шаблон" ожидаемое команда...: число строк вывода, подходящих под шаблон
count() {
  local desc=$1 pat=$2 want=$3; shift 3
  local got; got=$("$@" 2>&1 | grep -c -- "$pat")
  if [ "$got" = "$want" ]; then echo "✔ $desc"; OK=$((OK+1)); else echo "✘ $desc (ожидали $want, получили $got)"; BAD=$((BAD+1)); fi
}

VAC='{"type":"vacation","payload":{"vacation_type":"annual_paid","start_date":"2026-11-02","end_date":"2026-11-15","comment":"Семейная поездка"}}'
OVERLAP='{"type":"vacation","payload":{"vacation_type":"annual_paid","start_date":"2026-11-10","end_date":"2026-11-12"}}'
TOOLONG='{"type":"vacation","payload":{"vacation_type":"annual_paid","start_date":"2026-12-01","end_date":"2026-12-31"}}'
PAST='{"type":"vacation","payload":{"vacation_type":"annual_paid","start_date":"2026-01-01","end_date":"2026-01-05"}}'
HRVAC='{"type":"vacation","payload":{"vacation_type":"annual_paid","start_date":"2026-11-02","end_date":"2026-11-05"}}'

echo "== Сброс базы =="
docker compose exec -T app php artisan migrate:fresh --seed --force > /dev/null || { echo "миграции упали"; exit 1; }
rm -f /tmp/janamen-*.jar    # старые сессии после сброса недействительны

echo "== Инфраструктура и вход =="
check "health: db ok"                       200 '"db":"ok"'              health
check "/me без сессии → 401"                401 unauthenticated          anon_me
check "неверный пароль → 422"               422 invalid_credentials      env PASS=wrong $A a.seitkali@janapost.demo login
check "работник: team=false"                200 '"team": false'          $A a.seitkali@janapost.demo GET /api/v1/me
check "руководитель: team=true"             200 '"team": true'           $A e.akhmetov@janapost.demo GET /api/v1/me
check "HR-специалист: hr=true"              200 '"hr": true'             $A hr@janapost.demo GET /api/v1/me
check "смена языка"                         200 '"locale": "kz"'         $A a.seitkali@janapost.demo PATCH /api/v1/me '{"locale":"kz"}'
check "смена языка: невалидное → 422"       422 validation_failed        $A a.seitkali@janapost.demo PATCH /api/v1/me '{"locale":"xx"}'
check "вернуть язык ru"                     200 '"locale": "ru"'     $A a.seitkali@janapost.demo PATCH /api/v1/me '{"locale":"ru"}'

echo "== Профиль и 1С =="
check "профиль: руководитель Ахметов"       200 'Ахметов'                $A a.seitkali@janapost.demo GET /api/v1/profile
check "профиль: остаток 24"                 200 '"available_days": 24'   $A a.seitkali@janapost.demo GET /api/v1/profile
check "профиль директора: manager=null"     200 '"manager": null'        $A director@janapost.demo GET /api/v1/profile

echo "== Создание заявки =="
check "заявка создана (pending_manager)"   201 '"status": "pending_manager"' $A a.seitkali@janapost.demo POST /api/v1/requests "$VAC"
check "approver = Ахметов, действие cancel" 200 '"cancel"'               $A a.seitkali@janapost.demo GET /api/v1/requests/1
check "остаток: зарезервировано 14"         200 '"reserved_days": 14'    $A a.seitkali@janapost.demo GET /api/v1/profile
check "пересечение дат → dates_overlap"     422 dates_overlap            $A a.seitkali@janapost.demo POST /api/v1/requests "$OVERLAP"
check "мало дней → insufficient_balance"    422 insufficient_balance     $A a.seitkali@janapost.demo POST /api/v1/requests "$TOOLONG"
check "дата в прошлом → date_in_past"       422 date_in_past             $A a.seitkali@janapost.demo POST /api/v1/requests "$PAST"
check "список моих заявок"                  200 '"total": 1'             $A a.seitkali@janapost.demo GET /api/v1/requests
check "дашборд руководителя: 1 ждёт согласования" 200 '"team_pending_count": 1'  $A e.akhmetov@janapost.demo GET /api/v1/dashboard
check "дашборд работника: team_pending_count null" 200 '"team_pending_count": null' $A a.seitkali@janapost.demo GET /api/v1/dashboard
check "дашборд работника: последние заявки"       200 '"recent_requests"'        $A a.seitkali@janapost.demo GET /api/v1/dashboard
check "дашборд HR: очередь пока пуста"            200 '"hr_queue_count": 0'      $A hr@janapost.demo GET /api/v1/dashboard

echo "== Права доступа =="
check "чужая заявка → 403"                  403 forbidden                $A t.bekov@janapost.demo GET /api/v1/requests/1
check "несуществующая → 404"                404 not_found                $A a.seitkali@janapost.demo GET /api/v1/requests/999
check "работник не согласует → 403"         403 forbidden                $A t.bekov@janapost.demo POST /api/v1/requests/1/actions '{"action":"manager_approve"}'
check "HR до руководителя → invalid_transition" 409 invalid_transition   $A hr@janapost.demo POST /api/v1/requests/1/actions '{"action":"hr_approve"}'
check "отклонение без комментария → 422"    422 comment_required         $A e.akhmetov@janapost.demo POST /api/v1/requests/1/actions '{"action":"manager_reject"}'

echo "== Цепочка согласования заявки 1 =="
check "руководитель согласовал → pending_hr" 200 '"status": "pending_hr"' $A e.akhmetov@janapost.demo POST /api/v1/requests/1/actions '{"action":"manager_approve"}'
check "HR одобрил → awaiting_signature"     200 awaiting_signature       $A hr@janapost.demo POST /api/v1/requests/1/actions '{"action":"hr_approve"}'
check "подпись → approved"                  200 '"status": "approved"'   $A hr@janapost.demo POST /api/v1/requests/1/actions '{"action":"sign"}'
check "история: 4 записи"                   200 '"action": "sign"'       $A a.seitkali@janapost.demo GET /api/v1/requests/1

echo "== Интеграции и уведомления =="
check "подпись → остаток в 1С уменьшился"   200 '"balance_days": 10'    $A a.seitkali@janapost.demo GET /api/v1/profile
check "document_ref заполнен (Documentolog)" 200 'DOC-'                  $A a.seitkali@janapost.demo GET /api/v1/requests/1
check "Асель: 3 непрочитанных"              200 '"count": 3'            $A a.seitkali@janapost.demo GET /api/v1/notifications/unread-count
check "Асель: список уведомлений"           200 request_status_changed  $A a.seitkali@janapost.demo GET '/api/v1/notifications?unread=true'
check "Ахметов: 1 уведомление о заявке"     200 '"count": 1'            $A e.akhmetov@janapost.demo GET /api/v1/notifications/unread-count
check "hr2 получил уведомление об очереди"  200 '"count": 1'            $A hr2@janapost.demo GET /api/v1/notifications/unread-count
check "прочитать все → 204"                 204 ''                      $A a.seitkali@janapost.demo POST /api/v1/notifications/read-all
check "после этого счётчик 0"               200 '"count": 0'            $A a.seitkali@janapost.demo GET /api/v1/notifications/unread-count
check "прочитать не-uuid → 404"             404 not_found               $A a.seitkali@janapost.demo POST /api/v1/notifications/abc/read

echo "== Правило «двух ключей» (заявка HR-специалиста) =="
check "HR создал свою заявку (pending_manager)" 201 pending_manager      $A hr@janapost.demo POST /api/v1/requests "$HRVAC"
check "HR согласует свою → self_approval_forbidden" 403 self_approval_forbidden $A hr@janapost.demo POST /api/v1/requests/2/actions '{"action":"hr_approve"}'
check "чужой руководитель → 403"            403 forbidden                $A e.akhmetov@janapost.demo POST /api/v1/requests/2/actions '{"action":"manager_approve"}'
check "руководитель HR согласовал"          200 pending_hr               $A hr.head@janapost.demo POST /api/v1/requests/2/actions '{"action":"manager_approve"}'
check "он же второй шаг → already_participated" 403 already_participated $A hr.head@janapost.demo POST /api/v1/requests/2/actions '{"action":"hr_approve"}'
check "другой HR: reject без комментария"   422 comment_required         $A hr2@janapost.demo POST /api/v1/requests/2/actions '{"action":"hr_reject"}'
check "другой HR одобряет"                  200 awaiting_signature       $A hr2@janapost.demo POST /api/v1/requests/2/actions '{"action":"hr_approve"}'

echo "== Обращения в HR =="
check "обращение создано (open)"            201 '"status": "open"'  $A a.seitkali@janapost.demo POST /api/v1/profile/corrections '{"message":"Неверно указана дата приёма"}'
check "пустое обращение → 422"              422 required            $A a.seitkali@janapost.demo POST /api/v1/profile/corrections '{"message":""}'
check "HR видит действие answer"            200 '^ *"answer"$'      $A hr@janapost.demo GET /api/v1/requests/3
check "автор не может ответить → 403"       403 forbidden           $A a.seitkali@janapost.demo POST /api/v1/requests/3/actions '{"action":"answer","answer":"x"}'
check "HR отвечает → answered"              200 '"status": "answered"' $A hr@janapost.demo POST /api/v1/requests/3/actions '{"action":"answer","answer":"Дата исправлена в 1С"}'
check "автор получил request_answered"      200 request_answered    $A a.seitkali@janapost.demo GET '/api/v1/notifications?unread=true'

echo "== Роли: команда и HR =="
ASEL=$($A a.seitkali@janapost.demo GET /api/v1/me | grep -m1 '"id"' | tr -dc '0-9')

check "работник → team/requests 403"          403 forbidden       $A a.seitkali@janapost.demo GET /api/v1/team/requests
check "работник → hr/requests 403"            403 forbidden       $A a.seitkali@janapost.demo GET /api/v1/hr/requests
check "руководитель → hr/employees 403"       403 forbidden       $A e.akhmetov@janapost.demo GET /api/v1/hr/employees
check "HR без подчинённых → team 403"         403 forbidden       $A hr@janapost.demo GET /api/v1/team/employees

check "Ахметов: подчинённые"                  200 'Жумабаев'      $A e.akhmetov@janapost.demo GET /api/v1/team/employees
check "Ахметов: заявки команды (без обращений)" 200 '"total": 1'  $A e.akhmetov@janapost.demo GET /api/v1/team/requests
check "Ахметов: ждут согласования — 0"        200 '"total": 0'    $A e.akhmetov@janapost.demo GET '/api/v1/team/requests?status=pending_manager'
check "руководитель HR видит заявку hr@"      200 'Касымова'      $A hr.head@janapost.demo GET /api/v1/team/requests
check "руководитель не видит обращение → 403" 403 forbidden       $A e.akhmetov@janapost.demo GET /api/v1/requests/3

check "очередь HR: заявка hr@ видна hr2"      200 awaiting_signature $A hr2@janapost.demo GET '/api/v1/hr/requests?queue=true'
check "очередь HR: своя заявка не видна"      200 '"total": 0'    $A hr@janapost.demo GET '/api/v1/hr/requests?queue=true'
check "все заявки (HR)"                       200 '"total": 3'    $A hr@janapost.demo GET /api/v1/hr/requests
check "сотрудники: 9"                         200 '"total": 9'    $A hr@janapost.demo GET /api/v1/hr/employees
check "поиск по ФИО"                          200 '"total": 1'    $A hr@janapost.demo GET '/api/v1/hr/employees?search=%D0%9A%D0%B8%D0%BC'
check "карточка сотрудника"                   200 'Сейткали'      $A hr@janapost.demo GET /api/v1/hr/employees/$ASEL
check "карточка: нет такого → 404"            404 not_found       $A hr@janapost.demo GET /api/v1/hr/employees/9999
check "подразделения"                         200 employees_count $A hr@janapost.demo GET /api/v1/hr/departments
check "журнал: фильтр documentolog"           200 '"total": 2'    $A hr@janapost.demo GET '/api/v1/hr/integration-logs?system=documentolog'

echo "== Academy =="
C=/api/v1/courses
check "курс не назначен → 404"                404 not_found            $A a.seitkali@janapost.demo GET $C/1
check "работник не назначает курсы → 403"     403 forbidden            $A a.seitkali@janapost.demo POST /api/v1/hr/course-assignments "{\"course_id\":1,\"user_ids\":[$ASEL]}"
check "HR назначает курс"                     201 '"created": 1'       $A hr@janapost.demo POST /api/v1/hr/course-assignments "{\"course_id\":1,\"user_ids\":[$ASEL],\"due_date\":\"2026-12-31\"}"
check "повторное назначение пропущено"        201 '"skipped_already_assigned": 1' $A hr@janapost.demo POST /api/v1/hr/course-assignments "{\"course_id\":1,\"user_ids\":[$ASEL]}"
check "и user_ids, и department_id → 422"     422 validation_failed    $A hr@janapost.demo POST /api/v1/hr/course-assignments '{"course_id":1,"user_ids":[1],"department_id":1}'
check "Асель: мои курсы"                      200 'Добро пожаловать'   $A a.seitkali@janapost.demo GET $C
check "курс: not_started"                     200 '"status": "not_started"' $A a.seitkali@janapost.demo GET $C/1
check "глава: материал и вопросы"             200 content_md           $A a.seitkali@janapost.demo GET $C/1/chapters/1
if $A a.seitkali@janapost.demo GET $C/1/chapters/1 | grep -q is_correct; then
  echo "✘ is_correct попал в ответ"; BAD=$((BAD+1))
else
  echo "✔ is_correct не отдаётся"; OK=$((OK+1))
fi
check "глава чужого курса → 404"              404 not_found            $A a.seitkali@janapost.demo GET $C/1/chapters/5
check "«Изучил»"                              200 '"material_viewed": true' $A a.seitkali@janapost.demo POST $C/1/chapters/1/viewed
check "неполный тест → 422"                   422 incomplete_answers   $A a.seitkali@janapost.demo POST $C/1/chapters/1/quiz '{"answers":[{"question_id":1,"option_id":1}]}'
check "неверные ответы → не сдан"             200 '"passed": false'    $A a.seitkali@janapost.demo POST $C/1/chapters/1/quiz "$(quiz_body 1 false)"
check "верные ответы → сдан"                  200 '"passed": true'     $A a.seitkali@janapost.demo POST $C/1/chapters/1/quiz "$(quiz_body 1 true)"
check "прогресс курса 33%"                    200 '"progress_percent": 33' $A a.seitkali@janapost.demo GET $C/1
for ch in 2 3; do
  $A a.seitkali@janapost.demo POST $C/1/chapters/$ch/viewed > /dev/null
  $A a.seitkali@janapost.demo POST $C/1/chapters/$ch/quiz "$(quiz_body $ch true)" > /dev/null
done
check "курс завершён"                         200 '"status": "completed"' $A a.seitkali@janapost.demo GET $C/1
check "руководитель получил course_completed" 200 course_completed     $A e.akhmetov@janapost.demo GET '/api/v1/notifications?unread=true'
check "HR: статистика курсов"                 200 '"completed": 1'     $A hr@janapost.demo GET /api/v1/hr/courses
check "HR: назначения"                        200 '"total": 1'         $A hr@janapost.demo GET /api/v1/hr/course-assignments
check "дашборд: курсы"                        200 'Добро пожаловать'   $A a.seitkali@janapost.demo GET /api/v1/dashboard
check "команда: прогресс обучения"            200 '"completed": 1'     $A e.akhmetov@janapost.demo GET /api/v1/team/employees

echo "== База знаний и AI Jana =="
K=/api/v1/kb/documents
count "работник видит 10 документов"           '"slug"' 10 $A a.seitkali@janapost.demo GET $K
count "руководитель видит 11 документов"       '"slug"' 11 $A e.akhmetov@janapost.demo GET $K
count "HR видит 12 документов"                 '"slug"' 12 $A hr@janapost.demo GET $K
check "документ с разделами"                   200 duration            $A a.seitkali@janapost.demo GET $K/vacation-policy
check "регламент HR для работника → 403"       403 forbidden           $A a.seitkali@janapost.demo GET $K/hr-internal
check "регламент руководителя для работника → 403" 403 forbidden       $A a.seitkali@janapost.demo GET $K/manager-approval-guide
check "регламент руководителя → руководителю"  200 reject              $A e.akhmetov@janapost.demo GET $K/manager-approval-guide
check "нет такого документа → 404"             404 not_found           $A a.seitkali@janapost.demo GET $K/nope
check "пустой вопрос → 422"                    422 required            $A a.seitkali@janapost.demo POST /api/v1/ai/ask '{"question":""}'
check "вопрос к AI: ответ получен"             200 message_id          $A a.seitkali@janapost.demo POST /api/v1/ai/ask '{"question":"Сколько дней ежегодного отпуска мне положено?"}'
MID=$($A a.seitkali@janapost.demo POST /api/v1/ai/ask '{"question":"Какая погода завтра?"}' | grep -m1 '"message_id"' | tr -dc '0-9')
check "чужое сообщение → 403"                  403 forbidden           $A t.bekov@janapost.demo POST /api/v1/ai/messages/$MID/escalate
check "эскалация в HR → обращение open"        201 '"status": "open"'  $A a.seitkali@janapost.demo POST /api/v1/ai/messages/$MID/escalate '{"comment":"Нужно уточнить"}'
check "повторная эскалация → 409"              409 already_escalated   $A a.seitkali@janapost.demo POST /api/v1/ai/messages/$MID/escalate
check "обращение в очереди HR"                 200 ai_escalation       $A hr@janapost.demo GET '/api/v1/hr/requests?queue=true'
check "HR: вопросы к AI"                       200 escalated_request_id $A hr@janapost.demo GET /api/v1/hr/ai-messages
check "работник → hr/ai-messages 403"          403 forbidden           $A a.seitkali@janapost.demo GET /api/v1/hr/ai-messages

echo
echo "Журнал интеграций:"
docker compose exec -T db psql -U janamen -d janamen -c "select system, operation, status, message from integration_logs"

echo "Итого: ✔ $OK  ✘ $BAD"
[ "$BAD" -eq 0 ]