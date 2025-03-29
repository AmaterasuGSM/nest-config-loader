# Nest Config Loader

A flexible configuration module for NestJS that supports multiple file formats, including TypeScript in ESM projects.

## Features

- 🔄 Full compatibility with ESM projects (`"type": "module"` in package.json)
- 📁 Support for TypeScript, YAML, and Properties configuration files
- 🌐 Global module for easy access throughout your application
- 🔍 Simple dot-notation access to nested configuration
- 📦 Familiar API similar to @nestjs/config
- ⚙️ File loading and merging logic similar to node-config

## Installation

```bash
npm install nest-config-loader
```

## Usage

### Register the module

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "nest-config-loader";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Access configuration with dependency injection

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "nest-config-loader";

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    // Get a configuration value with a default
    const port = this.configService.get<number>("app.port", 3000);

    // Get a required configuration value (throws if not found)
    const apiKey = this.configService.get<string>("api.key");

    return `App running on port ${port}`;
  }
}
```

### Direct access to configuration

You can also access configuration directly without dependency injection:

```typescript
import { getConfig } from "nest-config-loader";

// Somewhere in your code
const dbConfig = getConfig<string>("db.local.token");
```

### Configuration Files

By default, the module looks for configuration files in the `config` directory of your project. You can customize this by setting the `NODE_CONFIG_DIR` environment variable.

The module loads files in the following order, with later files overriding earlier ones:

1. `default.[ext]` - Default configuration
2. `[environment].[ext]` - Environment-specific configuration (e.g., `development.ts`, `production.yml`)
3. `local.[ext]` - Local override configuration
4. `local-[environment].[ext]` - Local environment-specific override configuration

The environment is determined by the `NODE_ENV` environment variable.

Example directory structure:

```
/config
  default.yml
  default.ts
  production.yml
  development.ts
  local.yml
  local-development.ts
```

## TypeScript Configuration Example

```typescript
// config/default.ts
export default {
  app: {
    port: 3000,
    debug: true,
  },
  db: {
    host: "localhost",
    port: 5432,
    username: "postgres",
  },
};
```

## YAML Configuration Example

```yaml
# config/default.yml
app:
  port: 3000
  debug: true
db:
  host: localhost
  port: 5432
  username: postgres
```

## Properties Configuration Example

```properties
# config/default.properties
app.port=3000
app.debug=true
db.host=localhost
db.port=5432
db.username=postgres
```

## Environment Variables

- `NODE_ENV`: Determines which environment-specific files to load
- `NODE_CONFIG_DIR`: Specifies the directory or directories (separated by `:` or `;`) to look for configuration files

## License

MIT
