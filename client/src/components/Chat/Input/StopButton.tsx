import { TooltipAnchor } from '@librechat/client';
import { useLocalize } from '~/hooks';

export default function StopButton({ stop, setShowStopButton }) {
  const localize = useLocalize();

  return (
    <TooltipAnchor
      description={localize('com_nav_stop_generating')}
      render={
        <button
          type="button"
          className="group relative flex size-9 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95"
          style={{
            animation: 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
          aria-label={localize('com_nav_stop_generating')}
          onClick={(e) => {
            setShowStopButton(false);
            stop(e);
          }}
        >
          <style>{`
            @keyframes pulse-slow {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(0.97); }
            }
          `}</style>
          <div className="h-3.5 w-3.5 rounded-sm bg-gray-700 dark:bg-gray-300" />
        </button>
      }
    />
  );
}
