import { useThemeContext } from '@/common/theme-provider';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Slider } from '@/components/ui/slider';
import type { ReaderSettings } from '@dushu/shared';
import {
  AArrowDown,
  AArrowUp,
  ListChevronsDownUp,
  ListChevronsUpDown,
  ListIndentDecrease,
  ListIndentIncrease,
  Moon,
  RectangleVertical,
  RotateCcw,
  Rows2,
  Rows4,
  Scroll,
  Sun,
} from 'lucide-react';

interface ReaderSettingsPanelProps {
  settings: ReaderSettings;
  onUpdate: (patch: Partial<ReaderSettings>) => void;
  onReset: () => void;
}

const FONT_OPTIONS = [
  { label: 'Serif', value: 'Georgia, "Noto Serif SC", "Source Han Serif", serif' },
  { label: 'Sans-serif', value: 'system-ui, -apple-system, "Noto Sans SC",sans-serif' },
  { label: 'Monospace', value: '"SF Mono", "Fira Code", monospace' },
];

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 30;
export const FONT_SIZE_STEP = 1;

export const MIN_LINE_HEIGHT = 1.2;
export const MAX_LINE_HEIGHT = 4;
export const LINE_HEIGHT_STEP = 0.1;

export const MIN_PARAGRAPH_SPACING = 0;
export const MAX_PARAGRAPH_SPACING = 2;
export const PARAGRAPH_SPACING_STEP = 0.1;

export const MIN_INDENT = 0;
export const MAX_INDENT = 5;
export const INDENT_STEP = 0.5;

export const ReaderSettingsPanel = ({ settings, onUpdate, onReset }: ReaderSettingsPanelProps) => {
  const { theme, setTheme } = useThemeContext();
  const { fontSize, fontFamily, lineHeight, paragraphSpacing, indent, pageView } = settings;

  return (
    <div className="absolute right-0 top-0 h-full w-[clamp(12rem,10vw,20rem)] bg-background border-l z-10 no-scrollbar overflow-y-auto overflow-x-hidden shadow-lg animate-in slide-in-from-right duration-200">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex" />
          <Button size="icon" variant="ghost" onClick={onReset} title="Reset to defaults">
            <RotateCcw />
          </Button>
        </div>

        {/* Mode */}
        <SettingSection label="mood">
          <ButtonGroup className="flex-wrap w-full gap-2">
            <Button
              size="icon"
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="grow border! border-sidebar-accent!"
            >
              <Sun strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
            <Button
              size="icon"
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="grow border! border-sidebar-accent!"
            >
              <Moon strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
          </ButtonGroup>
          <div className="p-2 bg-highlight">Switch between different modes to enhance your reading experience</div>
        </SettingSection>

        {/* Font Family */}
        <SettingSection label="font">
          <div className="flex flex-wrap w-full gap-1">
            {FONT_OPTIONS.map((opt) => (
              <Button
                key={opt.label}
                size="sm"
                variant={fontFamily === opt.value ? 'default' : 'outline'}
                onClick={() => onUpdate({ fontFamily: opt.value })}
                className="grow border! border-sidebar-accent!"
                style={{ fontFamily: opt.value }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </SettingSection>

        {/* Font Size */}
        <SettingSection label="size">
          <ButtonGroup className="flex-wrap w-full gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={fontSize! <= MIN_FONT_SIZE}
              onClick={() => onUpdate({ fontSize: Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <AArrowDown strokeWidth={1} className="w-6! h-6!" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={fontSize! >= MAX_FONT_SIZE}
              onClick={() => onUpdate({ fontSize: Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <AArrowUp strokeWidth={1} className="w-6! h-6!" />
            </Button>
          </ButtonGroup>
          <SettingSlider value={fontSize} onChange={(v) => onUpdate({ fontSize: v })} min={MIN_FONT_SIZE} max={MAX_FONT_SIZE} step={FONT_SIZE_STEP} />
        </SettingSection>

        {/* Line Height */}
        <SettingSection label="height">
          <ButtonGroup className="flex-wrap w-full gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={lineHeight! <= MIN_LINE_HEIGHT}
              onClick={() => onUpdate({ lineHeight: Math.max(MIN_LINE_HEIGHT, lineHeight - LINE_HEIGHT_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <ListChevronsDownUp strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={lineHeight! >= MAX_LINE_HEIGHT}
              onClick={() => onUpdate({ lineHeight: Math.min(MAX_LINE_HEIGHT, lineHeight + LINE_HEIGHT_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <ListChevronsUpDown strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
          </ButtonGroup>
          <SettingSlider
            value={lineHeight}
            onChange={(v) => onUpdate({ lineHeight: v })}
            min={MIN_LINE_HEIGHT}
            max={MAX_LINE_HEIGHT}
            step={LINE_HEIGHT_STEP}
          />
        </SettingSection>

        {/* Paragraph Spacing */}
        <SettingSection label="spacing">
          <ButtonGroup className="flex-wrap w-full gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={paragraphSpacing! <= MIN_PARAGRAPH_SPACING}
              onClick={() => onUpdate({ paragraphSpacing: Math.max(MIN_PARAGRAPH_SPACING, paragraphSpacing - PARAGRAPH_SPACING_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <Rows4 strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={paragraphSpacing! >= MAX_PARAGRAPH_SPACING}
              onClick={() => onUpdate({ paragraphSpacing: Math.min(MAX_PARAGRAPH_SPACING, paragraphSpacing + PARAGRAPH_SPACING_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <Rows2 strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
          </ButtonGroup>
          <SettingSlider
            value={paragraphSpacing}
            onChange={(v) => onUpdate({ paragraphSpacing: v })}
            min={MIN_PARAGRAPH_SPACING}
            max={MAX_PARAGRAPH_SPACING}
            step={PARAGRAPH_SPACING_STEP}
          />
        </SettingSection>

        {/* Indent */}
        <SettingSection label="indent">
          <ButtonGroup className="flex-wrap w-full gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={indent! <= MIN_INDENT}
              onClick={() => onUpdate({ indent: Math.max(MIN_INDENT, indent - INDENT_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <ListIndentDecrease strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={indent! >= MAX_INDENT}
              onClick={() => onUpdate({ indent: Math.min(MAX_INDENT, indent + INDENT_STEP) })}
              className="grow border! border-sidebar-accent!"
            >
              <ListIndentIncrease strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
          </ButtonGroup>
          <SettingSlider value={indent} onChange={(v) => onUpdate({ indent: v })} min={MIN_INDENT} max={MAX_INDENT} step={INDENT_STEP} />
        </SettingSection>

        {/* Page View */}
        <SettingSection label="page view">
          <ButtonGroup className="flex-wrap w-full gap-2">
            <Button
              size="icon"
              variant={pageView === 'scroll' ? 'default' : 'outline'}
              onClick={() => onUpdate({ pageView: 'scroll' })}
              className="grow border! border-sidebar-accent! rounded-r-none!"
            >
              <Scroll strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
            <Button
              size="icon"
              variant={pageView === 'single' ? 'default' : 'outline'}
              onClick={() => onUpdate({ pageView: 'single' })}
              className="grow border! border-l-0! border-r-0! border-sidebar-accent! rounded-none!"
            >
              <RectangleVertical strokeWidth={1.5} className="w-5! h-5!" />
            </Button>
          </ButtonGroup>
        </SettingSection>
      </div>
    </div>
  );
};

interface SettingSectionProps {
  label: string;
  children: React.ReactNode;
}

const SettingSection = ({ label, children }: SettingSectionProps) => (
  <div className="flex flex-col gap-2">
    <div className="uppercase text-xs text-muted-foreground">{label}</div>
    {children}
  </div>
);

interface SettingSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export const SettingSlider = ({ value, min, max, step, onChange }: SettingSliderProps) => (
  <Slider value={[value]} min={min} max={max} step={step} onValueChange={(values) => onChange(values[0])} />
);
