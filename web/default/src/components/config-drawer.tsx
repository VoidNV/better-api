import { useEffect, useState, type SVGProps } from 'react'
import { Root as Radio, Item } from '@radix-ui/react-radio-group'
import { ChevronDown, CircleCheck, RotateCcw, Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconDir } from '@/assets/custom/icon-dir'
import { IconLayoutCompact } from '@/assets/custom/icon-layout-compact'
import { IconLayoutDefault } from '@/assets/custom/icon-layout-default'
import { IconLayoutFull } from '@/assets/custom/icon-layout-full'
import { IconSidebarFloating } from '@/assets/custom/icon-sidebar-floating'
import { IconSidebarInset } from '@/assets/custom/icon-sidebar-inset'
import { IconSidebarSidebar } from '@/assets/custom/icon-sidebar-sidebar'
import { IconThemeDark } from '@/assets/custom/icon-theme-dark'
import { IconThemeLight } from '@/assets/custom/icon-theme-light'
import { IconThemeSystem } from '@/assets/custom/icon-theme-system'
import { cn } from '@/lib/utils'
import { useDirection } from '@/context/direction-provider'
import { type Collapsible, useLayout } from '@/context/layout-provider'
import { type ColorPreset, useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Collapsible as CollapsibleRoot,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSidebar } from './ui/sidebar'

export function ConfigDrawer() {
  const { t } = useTranslation()
  const { setOpen } = useSidebar()
  const { resetDir } = useDirection()
  const { resetTheme } = useTheme()
  const { resetLayout } = useLayout()

  const handleReset = () => {
    setOpen(true)
    resetDir()
    resetTheme()
    resetLayout()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          aria-label={t('Open theme settings')}
          aria-describedby='config-drawer-description'
          className='rounded-full max-md:hidden'
        >
          <Palette className='size-[1.2rem]' aria-hidden='true' />
        </Button>
      </SheetTrigger>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='pb-0 text-start'>
          <SheetTitle>{t('Theme Settings')}</SheetTitle>
          <SheetDescription id='config-drawer-description'>
            {t('Adjust the appearance and layout to suit your preferences.')}
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-6 overflow-y-auto px-4'>
          <ThemeConfig />
          <ColorConfig />
          <SidebarConfig />
          <LayoutConfig />
          <DirConfig />
        </div>
        <SheetFooter className='gap-2'>
          <Button
            variant='destructive'
            onClick={handleReset}
            aria-label={t('Reset all settings to default values')}
          >
            {t('Reset')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SectionTitle({
  title,
  showReset = false,
  onReset,
  className,
}: {
  title: string
  showReset?: boolean
  onReset?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold',
        className
      )}
    >
      {title}
      {showReset && onReset && (
        <Button
          size='icon'
          variant='secondary'
          className='size-4 rounded-full'
          onClick={onReset}
          aria-label='Reset'
        >
          <RotateCcw className='size-3' aria-hidden='true' />
        </Button>
      )}
    </div>
  )
}

function RadioGroupItem({
  item,
  isTheme = false,
}: {
  item: {
    value: string
    label: string
    icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement
  }
  isTheme?: boolean
}) {
  return (
    <Item
      value={item.value}
      className={cn('group outline-none', 'transition duration-200 ease-in')}
      aria-label={`Select ${item.label.toLowerCase()}`}
      aria-describedby={`${item.value}-description`}
    >
      <div
        className={cn(
          'ring-border relative rounded-[6px] ring-[1px]',
          'group-data-[state=checked]:ring-primary group-data-[state=checked]:shadow-2xl',
          'group-focus-visible:ring-2'
        )}
        role='img'
        aria-hidden='false'
        aria-label={`${item.label} option preview`}
      >
        <CircleCheck
          className={cn(
            'fill-primary size-6 stroke-white',
            'group-data-[state=unchecked]:hidden',
            'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2'
          )}
          aria-hidden='true'
        />
        <item.icon
          className={cn(
            !isTheme &&
              'stroke-primary fill-primary group-data-[state=unchecked]:stroke-muted-foreground group-data-[state=unchecked]:fill-muted-foreground'
          )}
          aria-hidden='true'
        />
      </div>
      <div
        className='mt-1 text-xs'
        id={`${item.value}-description`}
        aria-live='polite'
      >
        {item.label}
      </div>
    </Item>
  )
}

function ThemeConfig() {
  const { t } = useTranslation()
  const { defaultTheme, theme, setTheme } = useTheme()
  return (
    <div>
      <SectionTitle
        title={t('Theme')}
        showReset={theme !== defaultTheme}
        onReset={() => setTheme(defaultTheme)}
      />
      <Radio
        value={theme}
        onValueChange={setTheme}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('Select theme preference')}
        aria-describedby='theme-description'
      >
        {[
          {
            value: 'system',
            label: 'System',
            icon: IconThemeSystem,
          },
          {
            value: 'light',
            label: 'Light',
            icon: IconThemeLight,
          },
          {
            value: 'dark',
            label: 'Dark',
            icon: IconThemeDark,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} isTheme />
        ))}
      </Radio>
      <div id='theme-description' className='sr-only'>
        {t('Choose between system preference, light mode, or dark mode')}
      </div>
    </div>
  )
}

const colorPresets: Array<{
  value: ColorPreset
  label: string
  colors: [string, string, string]
}> = [
  {
    value: 'neutral',
    label: 'Neutral',
    colors: ['#0a0a0a', '#71717a', '#e4e4e7'],
  },
  { value: 'blue', label: 'Blue', colors: ['#007aff', '#34c759', '#ff9500'] },
  {
    value: 'violet',
    label: 'Violet',
    colors: ['#7c3aed', '#06b6d4', '#f97316'],
  },
  { value: 'rose', label: 'Rose', colors: ['#ff2d55', '#007aff', '#34c759'] },
  {
    value: 'emerald',
    label: 'Emerald',
    colors: ['#10b981', '#007aff', '#f59e0b'],
  },
  { value: 'amber', label: 'Amber', colors: ['#ff9500', '#007aff', '#34c759'] },
]

function isValidHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function ColorConfig() {
  const { t } = useTranslation()
  const {
    colorPreset,
    customAccentColor,
    defaultColorPreset,
    setColorPreset,
    setCustomAccentColor,
  } = useTheme()
  const [draftAccent, setDraftAccent] = useState(customAccentColor)
  const hasCustomColor = colorPreset !== defaultColorPreset

  useEffect(() => {
    setDraftAccent(customAccentColor)
  }, [customAccentColor])

  const handleCustomAccentChange = (value: string) => {
    setDraftAccent(value)
    if (!isValidHexColor(value)) return
    setCustomAccentColor(value)
    setColorPreset('custom')
  }

  return (
    <div>
      <SectionTitle
        title={t('Color Presets')}
        showReset={hasCustomColor}
        onReset={() => setColorPreset(defaultColorPreset)}
      />
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
        {colorPresets.map((preset) => {
          const selected = colorPreset === preset.value
          return (
            <button
              key={preset.value}
              type='button'
              onClick={() => setColorPreset(preset.value)}
              className={cn(
                'border-border bg-card text-card-foreground flex h-16 items-center justify-between rounded-lg border px-3 text-left text-sm shadow-xs transition-[border-color,box-shadow,transform]',
                'hover:border-primary/50 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                selected && 'border-primary shadow-md'
              )}
              aria-pressed={selected}
            >
              <span className='font-medium'>{preset.label}</span>
              <span className='flex -space-x-1' aria-hidden='true'>
                {preset.colors.map((color) => (
                  <span
                    key={color}
                    className='border-background size-5 rounded-full border-2'
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <CollapsibleRoot className='mt-3 rounded-lg border'>
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='flex w-full items-center justify-between px-3 py-2 text-sm font-medium'
          >
            {t('Advanced Color')}
            <ChevronDown className='text-muted-foreground size-4' />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='border-t px-3 py-3'>
            <label className='text-muted-foreground text-xs font-medium'>
              {t('Custom accent')}
            </label>
            <div className='mt-2 flex items-center gap-2'>
              <Input
                type='color'
                value={customAccentColor}
                onChange={(event) =>
                  handleCustomAccentChange(event.currentTarget.value)
                }
                className='h-10 w-14 cursor-pointer p-1'
                aria-label={t('Custom accent')}
              />
              <Input
                value={draftAccent}
                onChange={(event) =>
                  handleCustomAccentChange(event.currentTarget.value)
                }
                onBlur={() => {
                  if (!isValidHexColor(draftAccent)) {
                    setDraftAccent(customAccentColor)
                  }
                }}
                className='font-mono uppercase'
                maxLength={7}
                aria-label={t('Custom accent hex value')}
              />
            </div>
            <p className='text-muted-foreground mt-2 text-xs leading-relaxed'>
              {t(
                'Pick a custom accent color for buttons, focus rings, charts, and sidebar highlights.'
              )}
            </p>
          </div>
        </CollapsibleContent>
      </CollapsibleRoot>
    </div>
  )
}

function SidebarConfig() {
  const { t } = useTranslation()
  const { defaultVariant, variant, setVariant } = useLayout()
  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title={t('Sidebar')}
        showReset={defaultVariant !== variant}
        onReset={() => setVariant(defaultVariant)}
      />
      <Radio
        value={variant}
        onValueChange={setVariant}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('Select sidebar style')}
        aria-describedby='sidebar-description'
      >
        {[
          {
            value: 'inset',
            label: 'Inset',
            icon: IconSidebarInset,
          },
          {
            value: 'floating',
            label: 'Floating',
            icon: IconSidebarFloating,
          },
          {
            value: 'sidebar',
            label: 'Sidebar',
            icon: IconSidebarSidebar,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='sidebar-description' className='sr-only'>
        {t('Choose between inset, floating, or standard sidebar layout')}
      </div>
    </div>
  )
}

function LayoutConfig() {
  const { t } = useTranslation()
  const { open, setOpen } = useSidebar()
  const { defaultCollapsible, collapsible, setCollapsible } = useLayout()

  const radioState = open ? 'default' : collapsible

  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title={t('Layout')}
        showReset={radioState !== 'default'}
        onReset={() => {
          setOpen(true)
          setCollapsible(defaultCollapsible)
        }}
      />
      <Radio
        value={radioState}
        onValueChange={(v) => {
          if (v === 'default') {
            setOpen(true)
            return
          }
          setOpen(false)
          setCollapsible(v as Collapsible)
        }}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('Select layout style')}
        aria-describedby='layout-description'
      >
        {[
          {
            value: 'default',
            label: 'Default',
            icon: IconLayoutDefault,
          },
          {
            value: 'icon',
            label: 'Compact',
            icon: IconLayoutCompact,
          },
          {
            value: 'offcanvas',
            label: 'Full layout',
            icon: IconLayoutFull,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='layout-description' className='sr-only'>
        {t(
          'Choose between default expanded, compact icon-only, or full layout mode'
        )}
      </div>
    </div>
  )
}

function DirConfig() {
  const { t } = useTranslation()
  const { defaultDir, dir, setDir } = useDirection()
  return (
    <div>
      <SectionTitle
        title={t('Direction')}
        showReset={defaultDir !== dir}
        onReset={() => setDir(defaultDir)}
      />
      <Radio
        value={dir}
        onValueChange={setDir}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label={t('Select site direction')}
        aria-describedby='direction-description'
      >
        {[
          {
            value: 'ltr',
            label: 'Left to Right',
            icon: (props: SVGProps<SVGSVGElement>) => (
              <IconDir dir='ltr' {...props} />
            ),
          },
          {
            value: 'rtl',
            label: 'Right to Left',
            icon: (props: SVGProps<SVGSVGElement>) => (
              <IconDir dir='rtl' {...props} />
            ),
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='direction-description' className='sr-only'>
        {t('Choose between left-to-right or right-to-left site direction')}
      </div>
    </div>
  )
}
