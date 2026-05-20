import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { dockerRunToCompose, composeToDockerRun } from '../../tools/docker-run-to-compose'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type Mode = 'run-to-compose' | 'compose-to-run'

export default function DockerRunToCompose(props: Props) {
  const [mode, setMode] = createSignal<Mode>('run-to-compose')
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['mode'] === 'string') setMode(saved['mode'] as Mode)
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    },
    getState: () => ({ mode: mode(), input: input() }),
  })

  const handleConvert = () => {
    const result =
      mode() === 'run-to-compose'
        ? dockerRunToCompose(input())
        : composeToDockerRun(input())

    if (result.ok) {
      setOutput(result.value)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  const handleSwap = () => {
    const prev = output()
    setOutput('')
    setError(null)
    setMode((m) => (m === 'run-to-compose' ? 'compose-to-run' : 'run-to-compose'))
    if (prev) setInput(prev)
  }

  const inputLabel = () =>
    mode() === 'run-to-compose'
      ? t(props.lang, 'tools_dockerRunToCompose_inputRun')
      : t(props.lang, 'tools_dockerRunToCompose_inputCompose')

  const inputPlaceholder = () =>
    mode() === 'run-to-compose'
      ? t(props.lang, 'tools_dockerRunToCompose_placeholderRun')
      : t(props.lang, 'tools_dockerRunToCompose_placeholderCompose')

  const outputLabel = () =>
    mode() === 'run-to-compose'
      ? t(props.lang, 'tools_dockerRunToCompose_outputCompose')
      : t(props.lang, 'tools_dockerRunToCompose_outputRun')

  const actionLabel = () =>
    mode() === 'run-to-compose'
      ? t(props.lang, 'tools_dockerRunToCompose_actionRunToCompose')
      : t(props.lang, 'tools_dockerRunToCompose_actionComposeToRun')

  return (
    <div class="flex flex-col gap-4">
      <div class="flex gap-2">
        <Button
          variant={mode() === 'run-to-compose' ? 'primary' : 'secondary'}
          onClick={() => { setMode('run-to-compose'); setInput(''); setOutput(''); setError(null) }}
        >
          {t(props.lang, 'tools_dockerRunToCompose_modeRunToCompose')}
        </Button>
        <Button
          variant={mode() === 'compose-to-run' ? 'primary' : 'secondary'}
          onClick={() => { setMode('compose-to-run'); setInput(''); setOutput(''); setError(null) }}
        >
          {t(props.lang, 'tools_dockerRunToCompose_modeComposeToRun')}
        </Button>
      </div>

      <TextArea
        label={inputLabel()}
        placeholder={inputPlaceholder()}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        rows={8}
      />

      <div class="flex gap-2">
        <Button variant="primary" onClick={handleConvert}>
          {actionLabel()}
        </Button>
        <Button variant="secondary" onClick={handleSwap}>
          {t(props.lang, 'tools_dockerRunToCompose_swap')}
        </Button>
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={outputLabel()} />
    </div>
  )
}
