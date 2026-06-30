import { pathToFileURL } from "node:url";
import {
  loadUsersConfig,
  upsertUser,
  removeUser,
  listUsers,
} from "../storage/user-access.js";
import { mintMagicToken, buildMagicLinkUrl } from "../auth/magic-link.js";
import { mintAdminToken } from "../auth/admin-token.js";

/**
 * Tiny admin CLI — the no-nanoclaw fallback for managing membership and minting
 * magic links directly on the host. Operates on the same users.yaml write store
 * and stateless token minting as the admin API.
 *
 *   npm run admin -- add-user <email> [group...]
 *   npm run admin -- set-groups <email> [group...]
 *   npm run admin -- remove <email>
 *   npm run admin -- mint-link <email>
 *   npm run admin -- list
 */

function baseUrl(): string {
  return process.env.BACKEND_URL || "http://localhost:3001";
}

function magicLinkFor(email: string): string {
  return buildMagicLinkUrl(baseUrl(), mintMagicToken(email));
}

export async function runAdminCommand(argv: string[]): Promise<string> {
  const [command, ...rest] = argv;

  switch (command) {
    case "add-user": {
      const [email, ...groups] = rest;
      if (!email) throw new Error("usage: add-user <email> [group...]");
      upsertUser(email, groups);
      return `Added ${email} [${groups.join(", ")}]\nMagic link: ${magicLinkFor(email)}`;
    }
    case "set-groups": {
      const [email, ...groups] = rest;
      if (!email) throw new Error("usage: set-groups <email> [group...]");
      if (!loadUsersConfig().users[email]) {
        throw new Error(`Unknown member: ${email}`);
      }
      upsertUser(email, groups);
      return `Updated ${email} [${groups.join(", ")}]`;
    }
    case "remove": {
      const [email] = rest;
      if (!email) throw new Error("usage: remove <email>");
      if (!removeUser(email)) throw new Error(`Unknown member: ${email}`);
      return `Removed ${email}`;
    }
    case "mint-link": {
      const [email] = rest;
      if (!email) throw new Error("usage: mint-link <email>");
      if (!loadUsersConfig().users[email]) {
        throw new Error(`Unknown member: ${email}`);
      }
      return magicLinkFor(email);
    }
    case "mint-admin-token": {
      const [email] = rest;
      if (!email) throw new Error("usage: mint-admin-token <email>");
      return mintAdminToken(email);
    }
    case "list": {
      const users = listUsers();
      const lines = Object.entries(users).map(
        ([email, entry]) => `${email}: [${(entry.groups || []).join(", ")}]`
      );
      return lines.length ? lines.join("\n") : "(no members)";
    }
    default:
      throw new Error(
        `Unknown command: ${command ?? "(none)"}\n` +
          "commands: add-user, set-groups, remove, mint-link, mint-admin-token, list"
      );
  }
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runAdminCommand(process.argv.slice(2))
    .then((out) => {
      console.log(out);
    })
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
