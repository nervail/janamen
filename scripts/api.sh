#!/usr/bin/env bash
# Использование: ./scripts/api.sh <email> <login|GET|POST|PATCH|DELETE> [путь] [json-тело]
BASE=${BASE:-http://localhost:8080}
EMAIL=$1; METHOD=${2:-GET}; URLPATH=$3; BODY=$4
JAR=/tmp/janamen-${EMAIL//[^a-zA-Z0-9]/_}.jar
HDR=(-H "Origin: http://localhost:5173" -H "Accept: application/json" -H "Content-Type: application/json")

xsrf() {
  grep XSRF-TOKEN "$JAR" | awk '{print $7}' \
    | python3 -c "import sys,urllib.parse;print(urllib.parse.unquote(sys.stdin.read().strip()))"
}

show() {  # $1 = файл с ответом, $2 = HTTP-код
  echo "HTTP $2"
  python3 -c "import sys,json;print(json.dumps(json.load(open(sys.argv[1])),ensure_ascii=False,indent=2))" "$1" 2>/dev/null || cat "$1"
}

do_login() {
  rm -f "$JAR"
  curl -s -c "$JAR" "${HDR[@]}" "$BASE/sanctum/csrf-cookie" -o /dev/null
  OUT=$(mktemp)
  CODE=$(curl -s -b "$JAR" -c "$JAR" "${HDR[@]}" -H "X-XSRF-TOKEN: $(xsrf)" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"${PASS:-demo-password}\"}" \
    -o "$OUT" -w "%{http_code}" "$BASE/api/v1/auth/login")
  [ "$CODE" = "200" ] || rm -f "$JAR"   # неудачный вход не оставляет «пустую» сессию
  show "$OUT" "$CODE"
}

if [ "$METHOD" = "login" ]; then do_login; exit; fi

if [ ! -f "$JAR" ]; then
  do_login > /dev/null
  [ -f "$JAR" ] || { echo "HTTP 000"; echo "login failed for $EMAIL (429 из-за лимита? проверь LOGIN_RATE_LIMIT)"; exit 1; }
fi

ARGS=(-s -b "$JAR" -c "$JAR" "${HDR[@]}" -H "X-XSRF-TOKEN: $(xsrf)" -X "$METHOD")
[ -n "$BODY" ] && ARGS+=(-d "$BODY")
OUT=$(mktemp)
CODE=$(curl "${ARGS[@]}" -o "$OUT" -w "%{http_code}" "$BASE$URLPATH")
show "$OUT" "$CODE"