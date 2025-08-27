#!/usr/bin/env node
import { EventEmitter } from 'events';
import { ServiceProvider, Application } from '@h3ravel/core';
import { access, readFile, writeFile, mkdir } from 'fs/promises';
import chalk from 'chalk';
import nodepath, { resolve, dirname } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import dayjs from 'dayjs';
import { arquebus } from '@h3ravel/arquebus';
import { spawn } from 'child_process';
import { program } from 'commander';
import { ConfigServiceProvider } from '@h3ravel/config';
import { DatabaseServiceProvider } from '@h3ravel/database';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function sync_default(start, callback) {
  let dir = resolve(".", start);
  let tmp, stats = statSync(dir);
  if (!stats.isDirectory()) {
    dir = dirname(dir);
  }
  while (true) {
    tmp = callback(dir, readdirSync(dir));
    if (tmp) return resolve(dir, tmp);
    dir = dirname(tmp = dir);
    if (tmp === dir) break;
  }
}
__name(sync_default, "default");
var join = nodepath.join;
var Utils = class {
  static {
    __name(this, "Utils");
  }
  /**
  * Wraps text with chalk
  * 
  * @param txt 
  * @param color 
  * @returns 
  */
  static textFormat(txt, color) {
    return String(txt).split(":").map((e, i, a) => i == 0 && a.length > 1 ? color(" " + e + ": ") : e).join("");
  }
  /**
  * Ouput formater object
  * 
  * @returns 
  */
  static output() {
    return {
      success: /* @__PURE__ */ __name((msg, exit = false) => {
        console.log(chalk.green("\u2713"), this.textFormat(msg, chalk.bgGreen), "\n");
        if (exit) process.exit(0);
      }, "success"),
      info: /* @__PURE__ */ __name((msg, exit = false) => {
        console.log(chalk.blue("\u2139"), this.textFormat(msg, chalk.bgBlue), "\n");
        if (exit) process.exit(0);
      }, "info"),
      error: /* @__PURE__ */ __name((msg, exit = true) => {
        if (msg instanceof Error) {
          if (msg.message) {
            console.error(chalk.red("\u2716"), this.textFormat("ERROR:" + msg.message, chalk.bgRed));
          }
          console.error(chalk.red(`${msg.detail ? `${msg.detail}
` : ""}${msg.stack}`), "\n");
        } else {
          console.error(chalk.red("\u2716"), this.textFormat(msg, chalk.bgRed), "\n");
        }
        if (exit) process.exit(1);
      }, "error"),
      split: /* @__PURE__ */ __name((name, value, status, exit = false) => {
        status ??= "info";
        const color = {
          success: chalk.bgGreen,
          info: chalk.bgBlue,
          error: chalk.bgRed
        };
        const regex = /\x1b\[\d+m/g;
        const width = Math.min(process.stdout.columns, 100);
        const dots = Math.max(width - name.replace(regex, "").length - value.replace(regex, "").length - 10, 0);
        console.log(this.textFormat(name, color[status]), chalk.gray(".".repeat(dots)), value);
        if (exit) process.exit(0);
      }, "split"),
      quiet: /* @__PURE__ */ __name(() => {
        process.exit(0);
      }, "quiet")
    };
  }
  static findModulePkg(moduleId, cwd) {
    const parts = moduleId.replace(/\\/g, "/").split("/");
    let packageName = "";
    if (parts.length > 0 && parts[0][0] === "@") {
      packageName += parts.shift() + "/";
    }
    packageName += parts.shift();
    const packageJson = nodepath.join(cwd ?? process.cwd(), "node_modules", packageName);
    const resolved = this.findUpConfig(packageJson, "package", [
      "json"
    ]);
    if (!resolved) {
      return;
    }
    return nodepath.join(nodepath.dirname(resolved), parts.join("/"));
  }
  static async getMigrationPaths(cwd, migrator, defaultPath, path3) {
    if (path3) {
      return [
        join(cwd, path3)
      ];
    }
    return [
      ...migrator.getPaths(),
      join(cwd, defaultPath)
    ];
  }
  static twoColumnDetail(name, value) {
    const regex = /\x1b\[\d+m/g;
    const width = Math.min(process.stdout.columns, 100);
    const dots = Math.max(width - name.replace(regex, "").length - value.replace(regex, "").length - 10, 0);
    return console.log(name, chalk.gray(".".repeat(dots)), value);
  }
  /**
  * Check if file exists
  * 
  * @param path 
  * @returns 
  */
  static async fileExists(path3) {
    try {
      await access(path3);
      return true;
    } catch {
      return false;
    }
  }
  static findUpConfig(cwd, name, extensions) {
    return sync_default(cwd, (_dir, names) => {
      for (const ext of extensions) {
        const filename = `${name}.${ext}`;
        if (names.includes(filename)) {
          return filename;
        }
      }
      return false;
    });
  }
};
var TableGuesser = class TableGuesser2 {
  static {
    __name(this, "TableGuesser");
  }
  static CREATE_PATTERNS = [
    /^create_(\w+)_table$/,
    /^create_(\w+)$/
  ];
  static CHANGE_PATTERNS = [
    /.+_(to|from|in)_(\w+)_table$/,
    /.+_(to|from|in)_(\w+)$/
  ];
  static guess(migration) {
    for (const pattern of TableGuesser2.CREATE_PATTERNS) {
      const matches = migration.match(pattern);
      if (matches) {
        return [
          matches[1],
          true
        ];
      }
    }
    for (const pattern of TableGuesser2.CHANGE_PATTERNS) {
      const matches = migration.match(pattern);
      if (matches) {
        return [
          matches[2],
          false
        ];
      }
    }
    return [];
  }
};

// src/Commands/Command.ts
var Command = class {
  static {
    __name(this, "Command");
  }
  app;
  kernel;
  constructor(app, kernel) {
    this.app = app;
    this.kernel = kernel;
  }
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  signature;
  /**
   * A dictionary of signatures or what not.
   *
   * @var object
   */
  dictionary = {};
  /**
   * The console command description.
   *
   * @var string
   */
  description;
  /**
   * The console command input.
   *
   * @var object
   */
  input = {
    options: {},
    arguments: {}
  };
  /**
   * Execute the console command.
   */
  async handle(..._args) {
  }
  setApplication(app) {
    this.app = app;
  }
  setInput(options, args, regArgs, dictionary) {
    this.dictionary = dictionary;
    this.input.options = options;
    this.input.arguments = regArgs.map((e, i) => ({
      [e.name()]: args[i]
    })).reduce((e, x) => Object.assign(e, x), {});
  }
  getSignature() {
    return this.signature;
  }
  getDescription() {
    return this.description;
  }
  option(key, def) {
    return this.input.options[key] ?? def;
  }
  options(key) {
    if (key) {
      return this.input.options[key];
    }
    return this.input.options;
  }
  argument(key, def) {
    return this.input.arguments[key] ?? def;
  }
  arguments() {
    return this.input.arguments;
  }
};
var MakeCommand = class extends Command {
  static {
    __name(this, "MakeCommand");
  }
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  signature = `#make:
        {controller : Generates a new controller class. | {--a|api : Generate an API resource controller} | {--force : Overide existing controller.} }
        {resource : Generates a new API resource class.}
        {migration : Generates a new database migration class. | {--l|type=ts : The file type to generate} | {--t|table : The table to migrate}  | {--c|create : The table to be created} }
        {factory : Generates a new database factory class.}
        {seeder : Generates a new database seeder class.}
        {model : Generates a new Arquebus model class. | {--t|type=ts : The file type to generate}} 
        {^name : The name of the [name] to generate}
    `;
  /**
   * The console command description.
   *
   * @var string
   */
  description = "Generate component classes";
  async handle() {
    const command = this.dictionary.baseCommand;
    const methods = {
      controller: "makeController",
      resource: "makeResource",
      migration: "makeMigration",
      factory: "makeFactory",
      seeder: "makeSeeder",
      model: "makeModel"
    };
    try {
      await this?.[methods[command]]();
    } catch (e) {
      this.kernel.output.error(e);
    }
  }
  /**
   * Generate a new controller class.
   */
  async makeController() {
    const type = this.option("api") ? "-resource" : "";
    const name = this.argument("name");
    const force = this.option("force");
    const path3 = nodepath.join(app_path("Http/Controllers"), name + ".ts");
    const dbPath = Utils.findModulePkg("@h3ravel/http", this.kernel.cwd) ?? "";
    const stubPath = nodepath.join(dbPath, `dist/stubs/controller${type}.stub`);
    if (!force && existsSync(path3)) {
      this.kernel.output.error(`ERORR: ${name} controller already exists`);
    }
    let stub = await readFile(stubPath, "utf-8");
    stub = stub.replace(/{{ name }}/g, name);
    await writeFile(path3, stub);
    this.kernel.output.split(`INFO: Controller Created`, chalk.gray(nodepath.basename(path3)));
  }
  makeResource() {
    this.kernel.output.success(`Resource support is not yet available`);
  }
  /**
   * Generate a new database migration class
   */
  async makeMigration() {
    const name = this.argument("name");
    const datePrefix = dayjs().format("YYYY_MM_DD_HHmmss");
    const path3 = nodepath.join(database_path("migrations"), `${datePrefix}_${name}.ts`);
    const dbPath = Utils.findModulePkg("@h3ravel/database", this.kernel.cwd) ?? "";
    let create = this.option("create", false);
    let table = this.option("table");
    if (!table && typeof create === "string") {
      table = create;
      create = true;
    }
    if (!table) {
      const guessed = TableGuesser.guess(name);
      table = guessed[0];
      create = !!guessed[1];
    }
    const stubPath = nodepath.join(dbPath, this.getMigrationStubName(table, create));
    let stub = await readFile(stubPath, "utf-8");
    if (table !== null) {
      stub = stub.replace(/DummyTable|{{\s*table\s*}}/g, table);
    }
    this.kernel.output.info("INFO: Creating Migration");
    await this.kernel.ensureDirectoryExists(nodepath.dirname(path3));
    await writeFile(path3, stub);
    this.kernel.output.split(`INFO: Migration Created`, chalk.gray(nodepath.basename(path3)));
  }
  makeFactory() {
    this.kernel.output.success(`Factory support is not yet available`);
  }
  makeSeeder() {
    this.kernel.output.success(`Seeder support is not yet available`);
  }
  /**
   * Generate a new Arquebus model class
   */
  async makeModel() {
    const type = this.option("type", "ts");
    const name = this.argument("name");
    const path3 = nodepath.join(app_path("Models"), name.toLowerCase() + "." + type);
    const dbPath = Utils.findModulePkg("@h3ravel/database", this.kernel.cwd) ?? "";
    const stubPath = nodepath.join(dbPath, `dist/stubs/model-${type}.stub`);
    let stub = await readFile(stubPath, "utf-8");
    stub = stub.replace(/{{ name }}/g, name);
    await writeFile(path3, stub);
    this.kernel.output.split(`INFO: Model Created`, chalk.gray(nodepath.basename(path3)));
  }
  /**
   * Ge the database migration file name
   * 
   * @param table 
   * @param create 
   * @param type 
   * @returns 
   */
  getMigrationStubName(table, create = false, type = "ts") {
    let stub;
    if (!table) {
      stub = `migration-${type}.stub`;
    } else if (create) {
      stub = `migration.create-${type}.stub`;
    } else {
      stub = `migration.update-${type}.stub`;
    }
    return "dist/stubs/" + stub;
  }
};
var MigrateCommand = class extends Command {
  static {
    __name(this, "MigrateCommand");
  }
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  signature = `migrate:
        {fresh : Drop all tables and re-run all migrations.}
        {install : Create the migration repository.}
        {refresh : Reset and re-run all migrations.}
        {reset : Rollback all database migrations.}
        {rollback : Rollback the last database migration.}
        {status : Show the status of each migration.}
        {publish : Publish any migration files from installed packages.}
        {^--s|seed : Seed the database}
    `;
  /**
   * The console command description.
   *
   * @var string
   */
  description = "Run all pending migrations.";
  /**
   * Execute the console command.
   */
  async handle() {
    const command = this.dictionary.name ?? this.dictionary.baseCommand;
    const methods = {
      migrate: "migrateRun",
      fresh: "migrateFresh",
      install: "migrateInstall",
      refresh: "migrateRefresh",
      reset: "migrateReset",
      rollback: "migrateRollback",
      status: "migrateStatus",
      publish: "migratePublish"
    };
    await this?.[methods[command]]();
  }
  /**
   * Run all pending migrations.
   */
  async migrateRun() {
    this.kernel.output.success(`Running migrations are not yet supported.`);
  }
  /**
   * Drop all tables and re-run all migrations.
   */
  async migrateFresh() {
    this.kernel.output.success(`Drop all tables and re-run all migrations.`);
  }
  /**
   * Create the migration repository.
   */
  async migrateInstall() {
    this.kernel.output.success(`Create the migration repository.`);
  }
  /**
   * Reset and re-run all migrations.
   */
  async migrateRefresh() {
    this.kernel.output.success(`Resetting and re-running migrations is not yet supported.`);
  }
  /**
   * Rollback all database migrations.
   */
  async migrateReset() {
    this.kernel.output.success(`Rolling back all migration is not yet supported.`);
  }
  /**
   * Rollback the last database migration.
   */
  async migrateRollback() {
    this.kernel.output.success(`Rolling back the last migration is not yet supported.`);
  }
  /**
   * Show the status of each migration.
   */
  async migrateStatus() {
    app_path();
    console.log(arquebus.connection());
    this.kernel.output.success(`Show the status of each migration.`);
  }
  /**
   * Publish any migration files from installed packages.
   */
  async migratePublish() {
    this.kernel.output.success(`Publish any migration files from installed packages.`);
  }
};
var ServeCommand = class extends Command {
  static {
    __name(this, "ServeCommand");
  }
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  signature = "serve";
  /**
   * The console command description.
   *
   * @var string
   */
  description = "Start the Developement Server";
  async handle() {
    try {
      await this.serve();
    } catch (e) {
      this.kernel.output.error(e);
    }
  }
  async serve() {
    const child = spawn("tsup-node", {
      stdio: "inherit",
      shell: true,
      env: Object.assign({}, process.env, {
        NODE_ENV: "development"
      }),
      detached: true
    });
    const cleanup = /* @__PURE__ */ __name(() => {
      console.log(111);
      if (child.pid) {
        process.kill(child.pid, "SIGTERM");
      }
    }, "cleanup");
    process.on("SIGINT", () => child.kill("SIGINT"));
    process.on("SIGTERM", () => child.kill("SIGTERM"));
    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });
  }
};

// src/Signature.ts
var Signature = class _Signature {
  static {
    __name(this, "Signature");
  }
  /**
   * Helper to parse options inside a block of text
   * 
   * @param block 
   * @returns 
   */
  static parseOptions(block) {
    const options = [];
    const regex = /\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
      const shared = "^" === match[1][0] || /:[#^]/.test(match[1]);
      const isHidden = ([
        "#",
        "^"
      ].includes(match[1][0]) || /:[#^]/.test(match[1])) && !shared;
      const content = match[1].trim().replace(/[#^]/, "");
      const colonIndex = content.indexOf(":");
      if (colonIndex === -1) {
        options.push({
          name: content
        });
        continue;
      }
      const namePart = content.substring(0, colonIndex).trim();
      let rest = content.substring(colonIndex + 1).trim();
      let description = rest;
      let nestedOptions;
      const pipeIndex = rest.indexOf("|");
      if (pipeIndex !== -1) {
        description = rest.substring(0, pipeIndex).trim();
        const nestedText = rest.substring(pipeIndex + 1).trim();
        const cleanedNestedText = nestedText.replace(/^\{/, "").trim();
        nestedOptions = _Signature.parseOptions("{" + cleanedNestedText + "}");
      } else {
        description = description.trim();
      }
      let name = namePart;
      let required = /[^a-zA-Z0-9_|-]/.test(name);
      let multiple = false;
      if (name.endsWith("?*")) {
        required = false;
        multiple = true;
        name = name.slice(0, -2);
      } else if (name.endsWith("*")) {
        multiple = true;
        name = name.slice(0, -1);
      } else if (name.endsWith("?")) {
        required = false;
        name = name.slice(0, -1);
      }
      const isFlag = name.startsWith("--");
      let flags;
      let defaultValue;
      if (isFlag) {
        const flagParts = name.split("|").map((s) => s.trim());
        flags = [];
        for (let part of flagParts) {
          if (part.startsWith("--") && part.slice(2).length === 1) {
            part = "-" + part.slice(2);
          } else if (part.startsWith("-") && !part.startsWith("--") && part.slice(1).length > 1) {
            part = "--" + part.slice(1);
          } else if (!part.startsWith("-") && part.slice(1).length > 1) {
            part = "--" + part;
          }
          const eqIndex = part.indexOf("=");
          if (eqIndex !== -1) {
            flags.push(part.substring(0, eqIndex));
            const val = part.substring(eqIndex + 1);
            if (val === "*") {
              defaultValue = [];
            } else if (val === "true" || val === "false" || !val && !required) {
              defaultValue = val === "true";
            } else if (!isNaN(Number(val))) {
              defaultValue = Number(val);
            } else {
              defaultValue = val;
            }
          } else {
            flags.push(part);
          }
        }
      }
      options.push({
        name: isFlag ? flags[flags.length - 1] : name,
        required,
        multiple,
        description,
        flags,
        shared,
        isFlag,
        isHidden,
        defaultValue,
        nestedOptions
      });
    }
    return options;
  }
  /**
   * Helper to parse a command's signature
   * 
   * @param signature 
   * @param commandClass 
   * @returns 
   */
  static parseSignature(signature, commandClass) {
    const lines = signature.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const isHidden = [
      "#",
      "^"
    ].includes(lines[0][0]) || /:[#^]/.test(lines[0]);
    const baseCommand = lines[0].replace(/[^\w=:-]/g, "");
    const description = commandClass.getDescription();
    const isNamespaceCommand = baseCommand.endsWith(":");
    const rest = lines.slice(1).join(" ");
    const allOptions = _Signature.parseOptions(rest);
    if (isNamespaceCommand) {
      return {
        baseCommand: baseCommand.slice(0, -1),
        isNamespaceCommand,
        subCommands: allOptions.filter((e) => !e.flags && !e.isHidden),
        description,
        commandClass,
        options: allOptions.filter((e) => !!e.flags),
        isHidden
      };
    } else {
      return {
        baseCommand,
        isNamespaceCommand,
        options: allOptions,
        description,
        commandClass,
        isHidden
      };
    }
  }
};
var Musket = class _Musket {
  static {
    __name(this, "Musket");
  }
  app;
  kernel;
  output = Utils.output();
  commands = [];
  constructor(app, kernel) {
    this.app = app;
    this.kernel = kernel;
  }
  async build() {
    this.loadBaseCommands();
    await this.loadDiscoveredCommands();
    return this.initialize();
  }
  loadBaseCommands() {
    const commands = [
      new ServeCommand(this.app, this.kernel),
      new MakeCommand(this.app, this.kernel),
      new MigrateCommand(this.app, this.kernel)
    ];
    commands.forEach((e) => this.addCommand(e));
  }
  async loadDiscoveredCommands() {
    const commands = [];
    commands.forEach((e) => this.addCommand(e));
  }
  addCommand(command) {
    this.commands.push(Signature.parseSignature(command.getSignature(), command));
  }
  initialize() {
    const cliVersion = [
      "H3ravel Version:",
      chalk.green(this.kernel.consolePackage.version)
    ].join(" ");
    const localVersion = [
      "Musket Version:",
      chalk.green(this.kernel.modulePackage.version || "None")
    ].join(" ");
    program.name("musket").version(`${cliVersion}
${localVersion}`);
    program.command("init").description("Initialize H3ravel.").action(async () => {
      this.output.success(`Initialized: H3ravel has been initialized!`);
    });
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      const instance = command.commandClass;
      if (command.isNamespaceCommand && command.subCommands) {
        const cmd = command.isHidden ? program : program.command(command.baseCommand).description(command.description ?? "").action(async () => {
          instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, command);
          await instance.handle();
        });
        if ((command.options?.length ?? 0) > 0) {
          command.options?.filter((v, i2, a) => a.findIndex((t) => t.name === v.name) === i2).forEach((opt) => {
            this.makeOption(opt, cmd);
          });
        }
        command.subCommands.filter((v, i2, a) => !v.shared && a.findIndex((t) => t.name === v.name) === i2).forEach((sub) => {
          const cmd2 = program.command(`${command.baseCommand}:${sub.name}`).description(sub.description || "").action(async () => {
            instance.setInput(cmd2.opts(), cmd2.args, cmd2.registeredArguments, sub);
            await instance.handle();
          });
          command.subCommands?.filter((e) => e.shared).forEach((opt) => {
            this.makeOption(opt, cmd2, false, sub);
          });
          command.options?.filter((e) => e.shared).forEach((opt) => {
            this.makeOption(opt, cmd2, false, sub);
          });
          if (sub.nestedOptions) {
            sub.nestedOptions.filter((v, i2, a) => a.findIndex((t) => t.name === v.name) === i2).forEach((opt) => {
              this.makeOption(opt, cmd2);
            });
          }
        });
      } else {
        const cmd = program.command(command.baseCommand).description(command.description ?? "");
        command?.options?.filter((v, i2, a) => a.findIndex((t) => t.name === v.name) === i2).forEach((opt) => {
          this.makeOption(opt, cmd, true);
        });
        cmd.action(async () => {
          instance.setInput(cmd.opts(), cmd.args, cmd.registeredArguments, command);
          await instance.handle();
        });
      }
    }
    return program;
  }
  makeOption(opt, cmd, parse, parent) {
    const description = opt.description?.replace(/\[(\w+)\]/g, (_, k) => parent?.[k] ?? `[${k}]`) ?? "";
    const type = opt.name.replaceAll("-", "");
    if (opt.isFlag) {
      if (parse) {
        const flags = opt.flags?.map((f) => f.length === 1 ? `-${f}` : `--${f}`).join(", ");
        cmd.option(flags || "", description, String(opt.defaultValue) || void 0);
      } else {
        cmd.option(opt.flags?.join(", ") + (opt.required ? ` <${type}>` : ""), description, opt.defaultValue);
      }
    } else {
      cmd.argument(opt.required ? `<${opt.name}>` : `[${opt.name}]`, description, opt.defaultValue);
    }
  }
  static async parse(kernel) {
    return (await new _Musket(kernel.app, kernel).build()).parseAsync();
  }
};
var Kernel = class _Kernel {
  static {
    __name(this, "Kernel");
  }
  app;
  cwd;
  output = Utils.output();
  basePath = "";
  modulePath;
  consolePath;
  modulePackage;
  consolePackage;
  constructor(app, basePath) {
    this.app = app;
  }
  static init(app) {
    const instance = new _Kernel(app);
    Promise.all([
      instance.loadRequirements()
    ]).then(([e]) => e.run());
  }
  async run() {
    await Musket.parse(this);
    process.exit(0);
  }
  async ensureDirectoryExists(dir) {
    await mkdir(dir, {
      recursive: true
    });
  }
  async loadRequirements() {
    this.cwd = nodepath.join(process.cwd(), this.basePath);
    this.modulePath = Utils.findModulePkg("@h3ravel/core", this.cwd) ?? "";
    this.consolePath = Utils.findModulePkg("@h3ravel/console", this.cwd) ?? "";
    try {
      this.modulePackage = await import(nodepath.join(this.modulePath, "package.json"));
    } catch {
      this.modulePackage = {
        version: "N/A"
      };
    }
    try {
      this.consolePackage = await import(nodepath.join(this.consolePath, "package.json"));
    } catch {
      this.consolePackage = {
        version: "N/A"
      };
    }
    return this;
  }
};
var ConsoleServiceProvider = class extends ServiceProvider {
  static {
    __name(this, "ConsoleServiceProvider");
  }
  static priority = 992;
  register() {
    Kernel.init(this.app);
  }
};

// src/IO/providers.ts
var providers_default = [
  ConfigServiceProvider,
  DatabaseServiceProvider,
  ConsoleServiceProvider
];

// src/IO/app.ts
var app_default = class {
  static {
    __name(this, "default");
  }
  async bootstrap() {
    const app = new Application(process.cwd());
    app.registerProviders(providers_default);
    await app.registerConfiguredProviders();
    await app.boot();
    new EventEmitter().once("SIGINT", () => process.exit(0));
    process.on("SIGINT", () => {
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      process.exit(0);
    });
  }
};

// src/run.ts
new app_default().bootstrap();
new EventEmitter().once("SIGINT", () => process.exit(0));
