import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("timewise", {
  migrations: "./migrations",
});
