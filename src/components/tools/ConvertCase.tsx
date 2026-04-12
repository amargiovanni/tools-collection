import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { convertCase } from '../../tools/convert-case'
import type { CaseType } from '../../tools/convert-case'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function ConvertCase(props: Props) {
  const [input, setInput] = createSignal('')
  const [caseType, setCaseType] = createSignal<CaseType>('upper')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['caseType'] === 'string') setCaseType(saved['caseType'] as CaseType)
    },
    getState: () => ({ input: input(), caseType: caseType() }),
  })

  const caseOptions = () => [
    { value: 'upper', label: t(props.lang, 'tools_convertCase_upper') },
    { value: 'lower', label: t(props.lang, 'tools_convertCase_lower') },
    { value: 'title', label: t(props.lang, 'tools_convertCase_titleCase') },
    { value: 'camel', label: t(props.lang, 'tools_convertCase_camel') },
    { value: 'snake', label: t(props.lang, 'tools_convertCase_snake') },
    { value: 'constant', label: t(props.lang, 'tools_convertCase_constant') },
  ]

  const handleConvert = () => {
    const result = convertCase(input(), caseType())
    if (result.ok) {
      setOutput(result.value)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'common_inputPlaceholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Select
        label={t(props.lang, 'tools_convertCase_name')}
        options={caseOptions()}
        value={caseType()}
        onChange={(e) => setCaseType(e.currentTarget.value as CaseType)}
      />
      <Button variant="primary" onClick={handleConvert}>
        {t(props.lang, 'common_convert')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
