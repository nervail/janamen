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

echo
echo "Журнал интеграций:"
docker compose exec -T db psql -U janamen -d janamen -c "select system, operation, status, message from integration_logs"

echo "Итого: ✔ $OK  ✘ $BAD"
[ "$BAD" -eq 0 ]