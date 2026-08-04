import bcrypt from "bcryptjs";
import { Writable } from "node:stream";
import readline from "node:readline/promises";

const saidaProtegida = new Writable({
  write(chunk, encoding, callback) {
    if (!this.silenciar) process.stdout.write(chunk, encoding);
    callback();
  },
});
saidaProtegida.silenciar = false;

const terminal = readline.createInterface({
  input: process.stdin,
  output: saidaProtegida,
  terminal: true,
});
try {
  process.stdout.write("Digite a senha administrativa: ");
  saidaProtegida.silenciar = true;
  const senha = await terminal.question("");
  saidaProtegida.silenciar = false;
  process.stdout.write("\n");
  if (senha.length < 12)
    throw new Error("Use uma senha com pelo menos 12 caracteres.");
  const hash = await bcrypt.hash(senha, 12);
  process.stdout.write(`${hash}\n`);
} catch (erro) {
  saidaProtegida.silenciar = false;
  process.stderr.write(
    `\n${erro instanceof Error ? erro.message : "Não foi possível gerar o hash."}\n`,
  );
  process.exitCode = 1;
} finally {
  terminal.close();
}
