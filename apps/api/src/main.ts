import "reflect-metadata";

import cookieParser from "cookie-parser";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { loadEnv } from "./config/env.js";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  });

  await app.listen(env.PORT);
}

void bootstrap();
