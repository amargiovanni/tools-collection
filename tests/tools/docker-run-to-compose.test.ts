import { describe, expect, it } from 'vitest'
import { composeToDockerRun, dockerRunToCompose } from '../../src/tools/docker-run-to-compose'

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
    expect(output).toContain('-e FOO=bar')
    expect(output).toContain('-e EMPTY')
    expect(output).toContain('--log-opt max-size=10m')
    expect(output).toContain('--ulimit nofile=1024:2048')
  })
})
