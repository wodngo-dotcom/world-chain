# 표준국어대사전 프록시 (Cloudflare Workers)

브라우저에서 국립국어원 표준국어대사전 오픈 API(`stdict.korean.go.kr`)를 직접
호출하면 인증키가 그대로 노출되고, CORS 때문에 아예 막힐 수도 있습니다.
이 워커는 그 사이에서 인증키를 안전하게 숨겨주는 아주 작은 서버입니다.

**인증키는 이 저장소 어디에도 저장하지 않습니다.** Cloudflare의 "시크릿"
기능으로만 등록하며, 그 값은 Cloudflare 서버에만 존재하고 깃허브에는 절대
올라가지 않습니다.

## 1. Cloudflare 계정 준비 (무료)

1. https://dash.cloudflare.com/sign-up 에서 무료 계정을 만듭니다 (신용카드 불필요).

## 2. 로컬에서 배포하기

이 폴더(`worker/`)에서 실행합니다.

```bash
cd worker
npx wrangler login   # 브라우저가 열리면 Cloudflare 계정으로 로그인
npx wrangler deploy  # 워커를 배포 (URL이 출력됩니다, 예: https://word-chain-stdict-proxy.<계정>.workers.dev)
```

## 3. 인증키를 시크릿으로 등록

```bash
npx wrangler secret put STDICT_API_KEY
```

실행하면 터미널이 값을 입력하라고 물어봅니다. 이때 국립국어원에서 받은
인증키를 붙여넣고 엔터를 누르세요. **이 값은 화면에 다시 출력되지 않고,
어떤 파일에도 저장되지 않습니다.**

## 4. 게임 쪽에 프록시 주소 연결

저장소 루트(worker 폴더 밖)에 `.env` 파일을 만들고 2번 단계에서 나온 워커
주소를 적습니다:

```
VITE_STDICT_PROXY_URL=https://word-chain-stdict-proxy.<계정>.workers.dev
```

`.env`는 `.gitignore`에 이미 등록되어 있어 깃허브에 올라가지 않습니다.
그 다음 `npm run build`로 다시 빌드하면 게임이 이 프록시를 통해 사전을
조회합니다.

## 동작 확인

배포 후 브라우저나 `curl`로 아래처럼 확인할 수 있습니다:

```bash
curl "https://word-chain-stdict-proxy.<계정>.workers.dev/search?q=사과"
```

`{"ok":true,"exists":true,"total":...,"definition":"..."}` 같은 응답이
오면 정상입니다.

## 다시 배포(코드 수정 시)

`worker/index.js`를 수정한 뒤에는 `worker` 폴더에서 `npx wrangler deploy`
를 다시 실행하면 됩니다. 시크릿은 한 번만 등록하면 계속 유지됩니다.
