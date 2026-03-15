import { Button } from './Button'
import { downloadFile } from '../../lib/download'

interface DownloadButtonProps {
  getData: () => string | Blob
  filename: string
  mimeType?: string
  label?: string
  class?: string
}

export function DownloadButton(props: DownloadButtonProps) {
  const handleDownload = () => {
    downloadFile(props.getData(), props.filename, props.mimeType)
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} class={props.class}>
      {props.label ?? 'Download'}
    </Button>
  )
}
