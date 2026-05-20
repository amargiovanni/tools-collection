import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { yamlToJson } from './yaml-formatter'

// ---------------------------------------------------------------------------
// Token parser
// ---------------------------------------------------------------------------

function tokenize(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let i = 0

  while (i < input.length) {
    const ch = input[i]!

    if (ch === '\\' && !inSingle && i + 1 < input.length) {
      i++
      current += input[i]!
    } else if (ch === "'" && !inDouble) {
      inSingle = !inSingle
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble
    } else if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current !== '') {
        tokens.push(current)
        current = ''
      }
    } else {
      current += ch
    }
    i++
  }
  if (current !== '') tokens.push(current)
  return tokens
}

function splitOnce(input: string, separator: string): [string, string] {
  const index = input.indexOf(separator)
  if (index < 0) return [input, '']
  return [input.slice(0, index), input.slice(index + 1)]
}

function listValues(value: MaybeJsonValue): JsonValue[] {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  return [value]
}

function environmentEntries(value: MaybeJsonValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (typeof entry === 'string') return [entry]
      if (entry !== null && typeof entry === 'object') {
        return Object.entries(entry).map(([key, raw]) =>
          raw === null || raw === undefined ? key : `${key}=${String(raw)}`
        )
      }
      return [String(entry)]
    })
  }

  const env = obj(value)
  return Object.entries(env).map(([key, raw]) =>
    raw === null || raw === undefined ? key : `${key}=${String(raw)}`
  )
}

// ---------------------------------------------------------------------------
// Parsed docker run structure
// ---------------------------------------------------------------------------

export interface DockerRunConfig {
  image: string
  containerName: string
  command: string[]
  detach: boolean
  interactive: boolean
  tty: boolean
  removeOnExit: boolean
  ports: string[]
  environment: string[]
  envFiles: string[]
  volumes: string[]
  networks: string[]
  networkAliases: string[]
  restart: string
  hostname: string
  dns: string[]
  dnsSearch: string[]
  extraHosts: string[]
  capAdd: string[]
  capDrop: string[]
  devices: string[]
  user: string
  workdir: string
  entrypoint: string
  memLimit: string
  cpus: string
  cpuShares: string
  labels: string[]
  logDriver: string
  logOpts: string[]
  links: string[]
  ulimits: string[]
  shmSize: string
  stopSignal: string
  expose: string[]
  tmpfs: string[]
  ip: string
  privileged: boolean
  readOnly: boolean
  init: boolean
  securityOpts: string[]
  sysctls: string[]
  pid: string
  ipc: string
}

function emptyConfig(): DockerRunConfig {
  return {
    image: '',
    containerName: '',
    command: [],
    detach: false,
    interactive: false,
    tty: false,
    removeOnExit: false,
    ports: [],
    environment: [],
    envFiles: [],
    volumes: [],
    networks: [],
    networkAliases: [],
    restart: '',
    hostname: '',
    dns: [],
    dnsSearch: [],
    extraHosts: [],
    capAdd: [],
    capDrop: [],
    devices: [],
    user: '',
    workdir: '',
    entrypoint: '',
    memLimit: '',
    cpus: '',
    cpuShares: '',
    labels: [],
    logDriver: '',
    logOpts: [],
    links: [],
    ulimits: [],
    shmSize: '',
    stopSignal: '',
    expose: [],
    tmpfs: [],
    ip: '',
    privileged: false,
    readOnly: false,
    init: false,
    securityOpts: [],
    sysctls: [],
    pid: '',
    ipc: '',
  }
}

// ---------------------------------------------------------------------------
// docker run → config
// ---------------------------------------------------------------------------

const BOOLEAN_FLAGS = new Set([
  '-d', '--detach',
  '-i', '--interactive',
  '-t', '--tty',
  '--rm',
  '--privileged',
  '--read-only',
  '--no-healthcheck',
  '--init',
  '-P', '--publish-all',
  '--sig-proxy',
  '--oom-kill-disable',
  '--disable-content-trust',
  '-a',
])

const VALUE_FLAGS = new Set([
  '--name',
  '-p', '--publish',
  '-e', '--env',
  '--env-file',
  '-v', '--volume', '--mount',
  '--restart',
  '--network', '--net',
  '--network-alias',
  '-h', '--hostname',
  '--dns', '--dns-search',
  '--add-host',
  '--cap-add', '--cap-drop',
  '--device',
  '-u', '--user',
  '-w', '--workdir',
  '--entrypoint',
  '-m', '--memory',
  '--cpus', '--cpu-shares',
  '-l', '--label',
  '--log-driver', '--log-opt',
  '--link',
  '--ulimit',
  '--shm-size',
  '--stop-signal',
  '--expose',
  '--tmpfs',
  '--ip',
  '--security-opt',
  '--sysctl',
  '--pid',
  '--ipc',
])

export function parseDockerRun(input: string): Result<DockerRunConfig> {
  const trimmed = input.trim()
  if (!trimmed) return err('EMPTY_INPUT', 'Please enter a docker run command')

  const tokens = tokenize(trimmed)

  // Strip "docker" and optional "container" prefix
  let i = 0
  if (tokens[i] === 'docker') i++
  if (tokens[i] === 'container') i++
  if (tokens[i] === 'run') i++
  if (i === 0) return err('INVALID_DOCKER_RUN', 'Input must start with "docker run"')

  const cfg = emptyConfig()
  let imageFound = false

  while (i < tokens.length) {
    const tok = tokens[i]!

    if (imageFound) {
      cfg.command.push(tok)
      i++
      continue
    }

    // Handle --flag=value
    let flag = tok
    let inlineValue: string | null = null
    const eqIdx = tok.indexOf('=')
    if (eqIdx > 0 && tok.startsWith('-')) {
      flag = tok.slice(0, eqIdx)
      inlineValue = tok.slice(eqIdx + 1)
    }

    // Expand combined short flags like -dit → -d -i -t
    if (/^-[a-zA-Z]{2,}$/.test(flag) && !VALUE_FLAGS.has(flag)) {
      const chars = flag.slice(1).split('')
      for (const ch of chars) {
        applyBooleanFlag(cfg, '-' + ch)
      }
      i++
      continue
    }

    if (BOOLEAN_FLAGS.has(flag)) {
      applyBooleanFlag(cfg, flag)
      i++
      continue
    }

    if (VALUE_FLAGS.has(flag)) {
      let value: string
      if (inlineValue !== null) {
        value = inlineValue
      } else {
        i++
        if (i >= tokens.length) break
        value = tokens[i]!
      }
      applyValueFlag(cfg, flag, value)
      i++
      continue
    }

    // Unknown flag — skip
    if (tok.startsWith('-')) {
      if (inlineValue === null) i++
      i++
      continue
    }

    // First non-flag token is the image
    cfg.image = tok
    imageFound = true
    i++
  }

  if (!cfg.image) return err('INVALID_DOCKER_RUN', 'No image specified')

  return ok(cfg)
}

function applyBooleanFlag(cfg: DockerRunConfig, flag: string): void {
  switch (flag) {
    case '-d': case '--detach': cfg.detach = true; break
    case '-i': case '--interactive': cfg.interactive = true; break
    case '-t': case '--tty': cfg.tty = true; break
    case '--rm': cfg.removeOnExit = true; break
    case '--privileged': cfg.privileged = true; break
    case '--read-only': cfg.readOnly = true; break
    case '--init': cfg.init = true; break
  }
}

function applyValueFlag(cfg: DockerRunConfig, flag: string, value: string): void {
  switch (flag) {
    case '--name': cfg.containerName = value; break
    case '-p': case '--publish': cfg.ports.push(value); break
    case '-e': case '--env': cfg.environment.push(value); break
    case '--env-file': cfg.envFiles.push(value); break
    case '-v': case '--volume': cfg.volumes.push(value); break
    case '--restart': cfg.restart = value; break
    case '--network': case '--net': cfg.networks.push(value); break
    case '--network-alias': cfg.networkAliases.push(value); break
    case '-h': case '--hostname': cfg.hostname = value; break
    case '--dns': cfg.dns.push(value); break
    case '--dns-search': cfg.dnsSearch.push(value); break
    case '--add-host': cfg.extraHosts.push(value); break
    case '--cap-add': cfg.capAdd.push(value); break
    case '--cap-drop': cfg.capDrop.push(value); break
    case '--device': cfg.devices.push(value); break
    case '-u': case '--user': cfg.user = value; break
    case '-w': case '--workdir': cfg.workdir = value; break
    case '--entrypoint': cfg.entrypoint = value; break
    case '-m': case '--memory': cfg.memLimit = value; break
    case '--cpus': cfg.cpus = value; break
    case '--cpu-shares': cfg.cpuShares = value; break
    case '-l': case '--label': cfg.labels.push(value); break
    case '--log-driver': cfg.logDriver = value; break
    case '--log-opt': cfg.logOpts.push(value); break
    case '--link': cfg.links.push(value); break
    case '--ulimit': cfg.ulimits.push(value); break
    case '--shm-size': cfg.shmSize = value; break
    case '--stop-signal': cfg.stopSignal = value; break
    case '--expose': cfg.expose.push(value); break
    case '--tmpfs': cfg.tmpfs.push(value); break
    case '--ip': cfg.ip = value; break
    case '--security-opt': cfg.securityOpts.push(value); break
    case '--sysctl': cfg.sysctls.push(value); break
    case '--pid': cfg.pid = value; break
    case '--ipc': cfg.ipc = value; break
  }
}

// ---------------------------------------------------------------------------
// config → Docker Compose YAML
// ---------------------------------------------------------------------------

function serviceNameFromImage(image: string): string {
  const withoutTag = image.split(':')[0]!
  const parts = withoutTag.split('/')
  return (parts[parts.length - 1] ?? 'app').replace(/[^a-zA-Z0-9_-]/g, '_')
}

function yamlList(items: string[], indent: string): string {
  return items.map((v) => `${indent}- "${v.replace(/"/g, '\\"')}"`).join('\n')
}

function yamlScalar(key: string, value: string, indent: string): string {
  const needsQuotes = /[:#{}[\],&*?|>!'%@`]/.test(value) || value.trim() !== value || value === ''
  return needsQuotes
    ? `${indent}${key}: "${value.replace(/"/g, '\\"')}"`
    : `${indent}${key}: ${value}`
}

export function configToCompose(cfg: DockerRunConfig): string {
  const serviceName = cfg.containerName || serviceNameFromImage(cfg.image)
  const lines: string[] = ['services:']
  const s = `  ${serviceName}:\n`
  const body: string[] = []

  body.push(`    image: ${cfg.image}`)
  if (cfg.containerName) body.push(`    container_name: ${cfg.containerName}`)
  if (cfg.restart) body.push(`    restart: ${cfg.restart}`)
  if (cfg.hostname) body.push(`    hostname: ${cfg.hostname}`)
  if (cfg.user) body.push(yamlScalar('user', cfg.user, '    '))
  if (cfg.workdir) body.push(yamlScalar('working_dir', cfg.workdir, '    '))
  if (cfg.entrypoint) body.push(yamlScalar('entrypoint', cfg.entrypoint, '    '))

  if (cfg.privileged) body.push('    privileged: true')
  if (cfg.readOnly) body.push('    read_only: true')
  if (cfg.init) body.push('    init: true')
  if (cfg.tty) body.push('    tty: true')
  if (cfg.interactive) body.push('    stdin_open: true')

  if (cfg.ports.length) {
    body.push('    ports:')
    body.push(yamlList(cfg.ports, '      '))
  }

  if (cfg.environment.length) {
    body.push('    environment:')
    body.push(yamlList(cfg.environment, '      '))
  }

  if (cfg.envFiles.length) {
    body.push('    env_file:')
    body.push(yamlList(cfg.envFiles, '      '))
  }

  if (cfg.volumes.length) {
    body.push('    volumes:')
    body.push(yamlList(cfg.volumes, '      '))
  }

  if (cfg.networks.length) {
    body.push('    networks:')
    body.push(yamlList(cfg.networks, '      '))
    if (cfg.networkAliases.length) {
      body.push('    # network aliases require explicit network config — see docs')
    }
  }

  if (cfg.dns.length) {
    body.push('    dns:')
    body.push(yamlList(cfg.dns, '      '))
  }

  if (cfg.dnsSearch.length) {
    body.push('    dns_search:')
    body.push(yamlList(cfg.dnsSearch, '      '))
  }

  if (cfg.extraHosts.length) {
    body.push('    extra_hosts:')
    body.push(yamlList(cfg.extraHosts, '      '))
  }

  if (cfg.capAdd.length) {
    body.push('    cap_add:')
    body.push(yamlList(cfg.capAdd, '      '))
  }

  if (cfg.capDrop.length) {
    body.push('    cap_drop:')
    body.push(yamlList(cfg.capDrop, '      '))
  }

  if (cfg.devices.length) {
    body.push('    devices:')
    body.push(yamlList(cfg.devices, '      '))
  }

  if (cfg.labels.length) {
    body.push('    labels:')
    body.push(yamlList(cfg.labels, '      '))
  }

  if (cfg.logDriver) {
    body.push('    logging:')
    body.push(`      driver: ${cfg.logDriver}`)
    if (cfg.logOpts.length) {
      body.push('      options:')
      for (const opt of cfg.logOpts) {
        const [k, v] = splitOnce(opt, '=')
        body.push(`        ${k}: "${v}"`)
      }
    }
  }

  if (cfg.ulimits.length) {
    body.push('    ulimits:')
    for (const u of cfg.ulimits) {
      const [uname, limits] = splitOnce(u, '=')
      const uparts = limits.split(':').filter((part) => part !== '')
      if (uparts.length >= 2) {
        body.push(`      ${uname}:`)
        body.push(`        soft: ${uparts[0]}`)
        body.push(`        hard: ${uparts.slice(1).join(':')}`)
      } else if (uparts.length === 1) {
        body.push(`      ${uname}: ${uparts[0]}`)
      } else {
        body.push(`      ${uname}:`)
      }
    }
  }

  if (cfg.securityOpts.length) {
    body.push('    security_opt:')
    body.push(yamlList(cfg.securityOpts, '      '))
  }

  if (cfg.sysctls.length) {
    body.push('    sysctls:')
    for (const s of cfg.sysctls) {
      const [k = '', v = ''] = s.split('=')
      body.push(`      ${k}: "${v}"`)
    }
  }

  if (cfg.expose.length) {
    body.push('    expose:')
    body.push(yamlList(cfg.expose, '      '))
  }

  if (cfg.tmpfs.length) {
    body.push('    tmpfs:')
    body.push(yamlList(cfg.tmpfs, '      '))
  }

  if (cfg.shmSize) body.push(`    shm_size: "${cfg.shmSize}"`)
  if (cfg.stopSignal) body.push(`    stop_signal: ${cfg.stopSignal}`)
  if (cfg.pid) body.push(`    pid: ${cfg.pid}`)
  if (cfg.ipc) body.push(`    ipc: ${cfg.ipc}`)
  if (cfg.memLimit) body.push(`    mem_limit: ${cfg.memLimit}`)
  if (cfg.cpus) body.push(`    cpus: ${cfg.cpus}`)

  if (cfg.command.length) {
    const cmd = cfg.command.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(' ')
    body.push(`    command: [${cmd}]`)
  }

  return (lines[0] ?? 'services:') + '\n' + s + body.join('\n')
}

export function dockerRunToCompose(input: string): Result<string> {
  const parsed = parseDockerRun(input)
  if (!parsed.ok) return parsed
  return ok(configToCompose(parsed.value))
}

// ---------------------------------------------------------------------------
// Docker Compose YAML → docker run command(s)
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonValue[] | Record<string, JsonValue>
type MaybeJsonValue = JsonValue | undefined

function str(v: MaybeJsonValue): string {
  if (v == null) return ''
  return String(v)
}

function arr(v: MaybeJsonValue): JsonValue[] {
  if (Array.isArray(v)) return v
  return []
}

function obj(v: MaybeJsonValue): Record<string, MaybeJsonValue> {
  if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, MaybeJsonValue>
  }
  return {}
}

function shellQuote(s: string): string {
  if (/[^a-zA-Z0-9_./:@=-]/.test(s)) return `"${s.replace(/"/g, '\\"')}"`
  return s
}

function serviceToDockerRun(name: string, svc: Record<string, MaybeJsonValue>): string {
  const parts: string[] = ['docker run']

  const image = str(svc['image'] ?? '')
  const containerName = str(svc['container_name'] ?? '')
  const restart = str(svc['restart'] ?? '')
  const hostname = str(svc['hostname'] ?? '')
  const user = str(svc['user'] ?? '')
  const workdir = str(svc['working_dir'] ?? '')
  const entrypoint = str(svc['entrypoint'] ?? '')
  const memLimit = str(svc['mem_limit'] ?? '')
  const cpus = str(svc['cpus'] ?? '')
  const shmSize = str(svc['shm_size'] ?? '')
  const stopSignal = str(svc['stop_signal'] ?? '')
  const pid = str(svc['pid'] ?? '')
  const ipc = str(svc['ipc'] ?? '')

  if (svc['detach'] === true) parts.push('-d')
  if (svc['stdin_open'] === true) parts.push('-i')
  if (svc['tty'] === true) parts.push('-t')
  if (svc['privileged'] === true) parts.push('--privileged')
  if (svc['read_only'] === true) parts.push('--read-only')
  if (svc['init'] === true) parts.push('--init')

  if (containerName) parts.push('--name', shellQuote(containerName))
  else if (name) parts.push('--name', shellQuote(name))

  if (restart) parts.push('--restart', restart)
  if (hostname) parts.push('--hostname', shellQuote(hostname))
  if (user) parts.push('-u', shellQuote(user))
  if (workdir) parts.push('-w', shellQuote(workdir))
  if (entrypoint) parts.push('--entrypoint', shellQuote(entrypoint))
  if (memLimit) parts.push('-m', memLimit)
  if (cpus) parts.push('--cpus', cpus)
  if (shmSize) parts.push('--shm-size', shellQuote(shmSize))
  if (stopSignal) parts.push('--stop-signal', stopSignal)
  if (pid) parts.push('--pid', pid)
  if (ipc) parts.push('--ipc', ipc)

  for (const p of listValues(svc['ports'])) parts.push('-p', shellQuote(str(p)))
  for (const v of listValues(svc['volumes'])) parts.push('-v', shellQuote(str(v)))
  for (const e of environmentEntries(svc['environment'])) parts.push('-e', shellQuote(e))
  for (const f of listValues(svc['env_file'])) parts.push('--env-file', shellQuote(str(f)))
  for (const n of listValues(svc['networks'])) parts.push('--network', shellQuote(str(n)))
  for (const d of arr(svc['dns'])) parts.push('--dns', str(d))
  for (const d of arr(svc['dns_search'])) parts.push('--dns-search', str(d))
  for (const h of arr(svc['extra_hosts'])) parts.push('--add-host', shellQuote(str(h)))
  for (const c of arr(svc['cap_add'])) parts.push('--cap-add', str(c))
  for (const c of arr(svc['cap_drop'])) parts.push('--cap-drop', str(c))
  for (const d of arr(svc['devices'])) parts.push('--device', shellQuote(str(d)))
  for (const l of arr(svc['labels'])) parts.push('-l', shellQuote(str(l)))
  for (const t of arr(svc['tmpfs'])) parts.push('--tmpfs', shellQuote(str(t)))
  for (const e of arr(svc['expose'])) parts.push('--expose', str(e))
  for (const s of arr(svc['security_opt'])) parts.push('--security-opt', shellQuote(str(s)))

  const logging = obj(svc['logging'])
  if (logging['driver']) {
    parts.push('--log-driver', str(logging['driver']))
    const opts = obj(logging['options'])
    for (const [k, v] of Object.entries(opts)) {
      parts.push('--log-opt', shellQuote(`${k}=${str(v)}`))
    }
  }

  const ulimits = obj(svc['ulimits'])
  for (const [uname, uval] of Object.entries(ulimits)) {
    if (typeof uval === 'number') {
      parts.push('--ulimit', `${uname}=${uval}`)
    } else if (typeof uval === 'string') {
      parts.push('--ulimit', `${uname}=${uval}`)
    } else {
      const u = obj(uval)
      if (u['soft'] !== undefined && u['hard'] !== undefined) {
        parts.push('--ulimit', `${uname}=${str(u['soft'])}:${str(u['hard'])}`)
      } else if (u['soft'] !== undefined) {
        parts.push('--ulimit', `${uname}=${str(u['soft'])}`)
      } else if (u['hard'] !== undefined) {
        parts.push('--ulimit', `${uname}=${str(u['hard'])}`)
      }
    }
  }

  const sysctls = obj(svc['sysctls'])
  for (const [k, v] of Object.entries(sysctls)) {
    parts.push('--sysctl', `${k}=${str(v)}`)
  }

  if (!image) return `# Service "${name}" has no image defined`
  parts.push(image)

  const command = svc['command']
  if (Array.isArray(command)) {
    for (const c of command) parts.push(shellQuote(str(c)))
  } else if (typeof command === 'string' && command) {
    parts.push(command)
  }

  return parts.join(' \\\n  ')
}

export function composeToDockerRun(input: string): Result<string> {
  if (!input.trim()) return err('EMPTY_INPUT', 'Please enter a Docker Compose file')

  const jsonResult = yamlToJson(input)
  if (!jsonResult.ok) return err('INVALID_YAML', jsonResult.error.message)

  let data: Record<string, JsonValue>
  try {
    data = JSON.parse(jsonResult.value) as Record<string, JsonValue>
  } catch {
    return err('INVALID_YAML', 'Could not parse the Docker Compose file')
  }

  const services = obj(data['services'])
  const names = Object.keys(services)

  if (names.length === 0) return err('INVALID_DOCKER_COMPOSE', 'No services found in the Compose file')

  const commands = names.map((name) => serviceToDockerRun(name, obj(services[name])))
  return ok(commands.join('\n\n'))
}
