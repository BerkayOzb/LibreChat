import React, { useMemo } from 'react';
import { useLocalize } from '~/hooks';
import { Tools } from 'librechat-data-provider';
import { UIResourceRenderer } from '@mcp-ui/client';
import UIResourceCarousel from './UIResourceCarousel';
import FinancialDataDisplay from './FinancialDataDisplay';
import type { TAttachment, UIResource } from 'librechat-data-provider';

function OptimizedCodeBlock({ text, maxHeight = 320 }: { text: string; maxHeight?: number }) {
  return (
    <div
      className="rounded-lg bg-surface-tertiary p-2 text-xs text-text-primary"
      style={{
        position: 'relative',
        maxHeight,
        overflow: 'auto',
      }}
    >
      <pre className="m-0 whitespace-pre-wrap break-words" style={{ overflowWrap: 'break-word' }}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function ToolCallInfo({
  input,
  output,
  domain,
  function_name,
  pendingAuth,
  attachments,
}: {
  input: string;
  function_name: string;
  output?: string | null;
  domain?: string;
  pendingAuth?: boolean;
  attachments?: TAttachment[];
}) {
  const localize = useLocalize();
  const formatText = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  /**
   * Detect if this is a Borsa-MCP tool call
   * Borsa-MCP tools include: get_stock_data, get_crypto_price, get_forex_rate, etc.
   */
  const isBorsaMCPTool = useMemo(() => {
    // Check if domain indicates borsa server
    if (domain === 'borsa') {
      return true;
    }
    // Check if function_name starts with borsa-related prefixes
    const borsaPrefixes = ['get_stock', 'get_bist', 'get_crypto', 'get_forex', 'get_fund', 'search_stock', 'search_fund'];
    return borsaPrefixes.some(prefix => function_name.toLowerCase().startsWith(prefix));
  }, [domain, function_name]);

  /**
   * Try to parse output as financial data
   */
  const financialData = useMemo(() => {
    if (!isBorsaMCPTool || !output) {
      return null;
    }
    try {
      const parsed = JSON.parse(output);
      // Check if it has financial data characteristics
      const hasFinancialFields =
        parsed.price !== undefined ||
        parsed.symbol !== undefined ||
        parsed.change !== undefined ||
        parsed.volume !== undefined ||
        parsed.buy !== undefined ||
        parsed.sell !== undefined;

      return hasFinancialFields ? parsed : null;
    } catch {
      return null;
    }
  }, [isBorsaMCPTool, output]);

  let title =
    domain != null && domain
      ? localize('com_assistants_domain_info', { 0: domain })
      : localize('com_assistants_function_use', { 0: function_name });
  if (pendingAuth === true) {
    title =
      domain != null && domain
        ? localize('com_assistants_action_attempt', { 0: domain })
        : localize('com_assistants_attempt_info');
  }

  const uiResources: UIResource[] =
    attachments
      ?.filter((attachment) => attachment.type === Tools.ui_resources)
      .flatMap((attachment) => {
        return attachment[Tools.ui_resources] as UIResource[];
      }) ?? [];

  return (
    <div className="w-full p-2">
      <div style={{ opacity: 1 }}>
        <div className="mb-2 text-sm font-medium text-text-primary">{title}</div>
        <div>
          <OptimizedCodeBlock text={formatText(input)} maxHeight={250} />
        </div>
        {output && (
          <>
            <div className="my-2 text-sm font-medium text-text-primary">
              {localize('com_ui_result')}
            </div>

            {/* Borsa-MCP Financial Data Display */}
            {financialData !== null ? (
              <div>
                <FinancialDataDisplay
                  data={financialData}
                  toolName={function_name}
                />
                {/* Also show raw data in collapsible section */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-text-secondary hover:text-text-primary">
                    {localize('com_ui_show_raw_data') || 'Ham veriyi göster'}
                  </summary>
                  <div className="mt-1">
                    <OptimizedCodeBlock text={formatText(output)} maxHeight={250} />
                  </div>
                </details>
              </div>
            ) : (
              <div>
                <OptimizedCodeBlock text={formatText(output)} maxHeight={250} />
              </div>
            )}

            {uiResources.length > 0 && (
              <div className="my-2 text-sm font-medium text-text-primary">
                {localize('com_ui_ui_resources')}
              </div>
            )}
            <div>
              {uiResources.length > 1 && <UIResourceCarousel uiResources={uiResources} />}

              {uiResources.length === 1 && (
                <UIResourceRenderer
                  resource={uiResources[0]}
                  onUIAction={async (result) => {
                    console.log('Action:', result);
                  }}
                  htmlProps={{
                    autoResizeIframe: { width: true, height: true },
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
