import { describe, expect, it } from 'vitest'
import { composeToDockerRun, dockerRunToCompose } from '../../src/tools/docker-run-to-compose'
import { yamlToJson } from '../../src/tools/yaml-formatter'

describe('docker-run-to-compose', () => {
  it('keeps log options and ulimits structured when converting docker run to Compose', () => {
    const result = dockerRunToCompose(
      'docker run --name app -e FOO=bar --log-driver json-file --log-opt max-size=10m --ulimit nofile=1024:2048 nginx:latest'
    )

    expect(result.ok).toBe(true)
    expect(result.ok ? result.value : '').toContain('services:')
    expect(result.ok ? result.value : '').toContain('container_name: app')
    expect(result.ok ? result.value : '').toContain('driver: json-file')
    expect(result.ok ? result.value : '').toContain('max-size: "10m"')
    expect(result.ok ? result.value : '').toContain('nofile:')
    expect(result.ok ? result.value : '').toContain('soft: 1024')
    expect(result.ok ? result.value : '').toContain('hard: 2048')
    expect(result.ok ? result.value : '').toContain('- "FOO=bar"')
  })

  it('supports map-based environment variables when converting Compose to docker run', () => {
    const result = composeToDockerRun(`
services:
  app:
    image: nginx:latest
    environment:
      FOO: bar
      EMPTY:
    logging:
      driver: json-file
      options:
        max-size: 10m
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
`)

    expect(result.ok).toBe(true)
    const output = result.ok ? result.value : ''
    const normalized = output.replace(/\\\s*\n\s*/g, ' ').replace(/\s+/g, ' ')

    expect(normalized).toContain('-e FOO=bar')
    expect(normalized).toContain('-e EMPTY')
    expect(normalized).toContain('--log-opt max-size=10m')
    expect(normalized).toContain('--ulimit nofile=1024:2048')
  })

  it('escapes backslashes and quotes so the generated Compose YAML round-trips', () => {
    // CodeQL js/incomplete-sanitization: only `"` was escaped, so a value with a
    // backslash produced invalid YAML (`\U`) or broke out of the quoted scalar.
    const result = dockerRunToCompose(
      String.raw`docker run -v 'C:\Users\app:/data' -e 'MSG=say \"hi\" \' -l 'path=C:\x' ` +
        String.raw`--log-driver json-file --log-opt 'tag=a\b' nginx sh -c 'echo \"x\"'`
    )
    expect(result.ok).toBe(true)
    const yaml = result.ok ? result.value : ''
    const parsed = yamlToJson(yaml)
    expect(parsed.ok, parsed.ok ? '' : parsed.error.message).toBe(true)
    const svc = JSON.parse(parsed.ok ? parsed.value : '{}').services.nginx
    expect(svc.volumes).toEqual([String.raw`C:\Users\app:/data`])
    expect(svc.environment).toEqual(['MSG=say \\"hi\\" \\'])
    expect(svc.labels).toEqual([String.raw`path=C:\x`])
    expect(svc.logging.options.tag).toBe(String.raw`a\b`)
    expect(svc.command).toEqual(['sh', '-c', String.raw`echo \"x\"`])
  })

  it('single-quotes docker run arguments so the shell does not expand them', () => {
    // CodeQL js/incomplete-sanitization: double quotes left `$`, backticks and
    // backslashes live, so `$(...)` in a Compose value ran when the command was pasted.
    const result = composeToDockerRun(`
services:
  app:
    image: nginx
    environment:
      CMD: "$(id)"
      WIN: 'C:\\temp'
      QUOTE: "it's"
`)
    expect(result.ok).toBe(true)
    const cmd = result.ok ? result.value : ''
    expect(cmd).toContain(`'CMD=$(id)'`)
    expect(cmd).toContain(String.raw`'WIN=C:\temp'`)
    expect(cmd).toContain(`'QUOTE=it'\\''s'`)
    expect(cmd).not.toContain('"')
  })
})
