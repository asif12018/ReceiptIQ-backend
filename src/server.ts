import app, { prisma } from "./app";

const PORT = process.env.PORT || 5000;
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("Database connected via Prisma");

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
      console.log("UNHANDLED REJECTION! Shutting down...");
      console.log(err);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }
}

bootstrap();
