import {
  AlertTriangle,
  Eye,
  FileText,
  Heading2,
  Link,
  List,
  Pilcrow,
  Plus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type BuilderTemplate = {
  label: string
  value: string
}

type ContentBuilderProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  templates?: BuilderTemplate[]
  className?: string
}

const defaultTemplates: BuilderTemplate[] = [
  {
    label: 'Maintenance',
    value:
      '## Scheduled maintenance\n\nWe will perform maintenance on **Friday at 22:00 UTC**.\n\n- API traffic may be briefly delayed\n- Dashboard access remains available\n\nThank you for your patience.',
  },
  {
    label: 'Policy',
    value:
      '## Terms\n\nBy using this service, you agree to follow our acceptable use rules.\n\n### Account access\n\nKeep your account credentials and API keys secure.\n\n### Billing\n\nUsage is charged according to the active pricing shown in your dashboard.',
  },
  {
    label: 'Welcome',
    value:
      '## Welcome\n\nUse this gateway to access your AI models from one API endpoint.\n\n[Open the dashboard](/dashboard)',
  },
]

const snippets = [
  { label: 'Heading', icon: Heading2, value: '\n## Section title\n\n' },
  { label: 'Paragraph', icon: Pilcrow, value: '\nWrite a clear paragraph here.\n\n' },
  { label: 'List', icon: List, value: '\n- First item\n- Second item\n- Third item\n' },
  { label: 'Link', icon: Link, value: '[Link text](https://example.com)' },
  {
    label: 'Callout',
    icon: AlertTriangle,
    value: '\n> Important: add the key message here.\n',
  },
]

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value.trim())
}

export function ContentBuilder({
  value,
  onChange,
  placeholder,
  rows = 10,
  templates = defaultTemplates,
  className,
}: ContentBuilderProps) {
  const { t } = useTranslation()

  const appendSnippet = (snippet: string) => {
    onChange(`${value || ''}${snippet}`)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex flex-wrap items-center gap-2'>
        {templates.map((template) => (
          <Button
            key={template.label}
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onChange(template.value)}
          >
            <FileText className='size-4' />
            {t(template.label)}
          </Button>
        ))}
      </div>

      <Tabs defaultValue='write'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <TabsList>
            <TabsTrigger value='write'>
              <Plus className='size-4' />
              {t('Write')}
            </TabsTrigger>
            <TabsTrigger value='preview'>
              <Eye className='size-4' />
              {t('Preview')}
            </TabsTrigger>
          </TabsList>
          <div className='flex flex-wrap gap-1'>
            {snippets.map((snippet) => (
              <Button
                key={snippet.label}
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => appendSnippet(snippet.value)}
                title={t(snippet.label)}
                aria-label={t(snippet.label)}
              >
                <snippet.icon className='size-4' />
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value='write' className='mt-3'>
          <Textarea
            rows={rows}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            placeholder={placeholder}
            className='font-mono text-sm leading-6'
          />
        </TabsContent>

        <TabsContent value='preview' className='mt-3'>
          <div className='bg-background min-h-48 rounded-md border p-4'>
            {value?.trim() ? (
              isExternalUrl(value) ? (
                <iframe
                  src={value.trim()}
                  title={t('Preview')}
                  className='h-80 w-full rounded-md border'
                />
              ) : (
                <Markdown>{value}</Markdown>
              )
            ) : (
              <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>
                {t('Nothing to preview yet')}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
