import { buildSrcDoc } from '@/common/buildSrcdoc';
import { useThemeContext } from '@/common/theme-provider';
import type { ReaderSettings, TxtRenditionDescriptor } from '@dushu/shared';
import { useMemo, useRef } from 'react';

interface ReaderTxtProps {
  bookId: string;
  rendition: TxtRenditionDescriptor;
  settings: ReaderSettings;
}

export const ReaderTxt = ({ bookId, rendition, settings }: ReaderTxtProps) => {
  const { isDark } = useThemeContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build full HTML document for the iframe
  const srcDoc = useMemo(() => {
    const html = rendition.segments.map((seg) => `<p>${seg.text}</p>`).join('\n');
    return buildSrcDoc(html, bookId, settings, isDark);
  }, [rendition, bookId, settings, isDark]);

  return (
    <>
      <iframe ref={iframeRef} srcDoc={srcDoc} title="Book content" className="w-full h-full border-0" sandbox="allow-same-origin" />
    </>
  );
};
