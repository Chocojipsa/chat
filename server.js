const path = require("path");
const axios = require('axios');
const fastify = require("fastify")({
  logger: true, // 로깅을 활성화
});

const fastifyStatic = require('@fastify/static');
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});

// fastify-cors 플러그인 추가 (업데이트된 버전 사용)
fastify.register(require('@fastify/cors'), {
  origin: "*", // 모든 도메인에서 요청을 허용
});

require('dotenv').config(); // .env 파일을 사용해 환경 변수 로드

// "/" 엔드포인트
fastify.get("/", async function (request, reply) {
  return reply.sendFile("index.html"); // index.html 파일을 반환
});

// "/chat" 엔드포인트
fastify.post("/chat", async function (request, reply) {
  const { GEMINI_KEY } = process.env;
  const userMessage = request.body.message; // 사용자가 보낸 메시지

  if (!GEMINI_KEY) {
    return reply.status(500).send({ error: "GEMINI_KEY 환경 변수가 설정되지 않았습니다." });
  }

  if (!userMessage) {
    return reply.status(400).send({ error: "메시지가 비어있습니다." });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  
  try {
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              text: userMessage,  // 사용자가 보낸 메시지를 그대로 전달
            },
          ],
        },
      ],
    });

    // JSON 형태로 응답이 오기 때문에, 별도로 JSON.parse를 할 필요 없이 바로 사용 가능
    const json = response.data;

    // 응답의 구조에 맞게 필요한 값을 추출
    const answer = json.candidates[0].content.parts[0].text;

    // 클라이언트에 챗봇 응답을 반환
    return reply.send({ reply: answer });

  } catch (error) {
    console.error("Error during API call:", error);
    return reply.status(500).send({ error: "API 호출 중 오류가 발생했습니다." });
  }
});

// 서버 시작
fastify.listen(
  { port: process.env.PORT || 3000, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);