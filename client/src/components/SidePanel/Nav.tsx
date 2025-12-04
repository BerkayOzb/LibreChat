import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  AccordionContent,
  AccordionItem,
  TooltipAnchor,
  Accordion,
  Button,
} from '@librechat/client';
import type { NavLink, NavProps } from '~/common';
import { ActivePanelProvider, useActivePanel } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

function NavContent({ links, isCollapsed, resize }: Omit<NavProps, 'defaultActive'>) {
  const localize = useLocalize();
  const { active, setActive } = useActivePanel();
  const getVariant = (link: NavLink) => (link.id === active ? 'default' : 'ghost');

  return (
    <div
      data-collapsed={isCollapsed}
      className="bg-token-sidebar-surface-primary hide-scrollbar group flex-shrink-0 overflow-x-hidden"
    >
      <div className="h-full">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-full min-h-0 flex-col opacity-100 transition-opacity">
            {/* Logo Section */}
            {!isCollapsed && (
              <div className="flex items-center justify-center border-b border-border-light px-4 py-4">
                <img
                  src="/assets/logo-light.png"
                  alt="Logo"
                  className="h-8 w-auto dark:hidden"
                />
                <img
                  src="/assets/logo-dark.png"
                  alt="Logo"
                  className="hidden h-8 w-auto dark:block"
                />
              </div>
            )}
            <div className="scrollbar-trigger relative h-full w-full flex-1 items-start border-white/20">
              <div className="flex h-full w-full flex-col gap-1 px-4 py-4 group-[[data-collapsed=true]]:items-center group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                {links.map((link, index) => {
                  const variant = getVariant(link);
                  const isActive = active === link.id;
                  return isCollapsed ? (
                    <TooltipAnchor
                      description={localize(link.title)}
                      side="left"
                      key={`nav-link-${index}`}
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-10 w-10 rounded-xl transition-all duration-200',
                            isActive
                              ? 'bg-surface-secondary text-text-primary shadow-sm'
                              : 'text-text-secondary hover:bg-surface-secondary/50 hover:text-text-primary',
                          )}
                          onClick={(e) => {
                            if (link.onClick) {
                              link.onClick(e);
                              setActive('');
                              return;
                            }
                            setActive(link.id);
                            resize && resize(25);
                          }}
                        >
                          <link.icon className="h-5 w-5" />
                          <span className="sr-only">{localize(link.title)}</span>
                        </Button>
                      }
                    />
                  ) : (
                    <Accordion
                      key={index}
                      type="single"
                      value={active}
                      onValueChange={setActive}
                      collapsible
                    >
                      <AccordionItem value={link.id} className="w-full border-none">
                        <TooltipAnchor
                          description={link.tooltip ? localize(link.tooltip) : undefined}
                          side="left"
                          render={
                            <AccordionPrimitive.Header asChild>
                              <AccordionPrimitive.Trigger asChild>
                                <Button
                                  variant="ghost"
                                  size="default"
                                  className={cn(
                                    'group flex h-auto w-full items-center justify-start gap-4 rounded-xl px-4 py-2 transition-all duration-200 ease-in-out',
                                    isActive
                                      ? 'bg-surface-secondary shadow-sm'
                                      : 'bg-transparent hover:bg-surface-secondary hover:shadow-md',
                                  )}
                                  onClick={(e) => {
                                    if (link.onClick) {
                                      link.onClick(e);
                                      setActive('');
                                    }
                                  }}
                                >
                                  <div
                                    className={cn(
                                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200',
                                      isActive
                                        ? 'bg-surface-tertiary text-text-primary'
                                        : 'bg-surface-tertiary/30 text-text-secondary group-hover:bg-surface-tertiary/60 group-hover:text-text-primary',
                                    )}
                                  >
                                    <link.icon className="h-5 w-5" />
                                  </div>
                                  <span
                                    className={cn(
                                      'text-sm font-semibold transition-colors',
                                      isActive
                                        ? 'text-text-primary'
                                        : 'text-text-secondary group-hover:text-text-primary',
                                    )}
                                  >
                                    {localize(link.title)}
                                  </span>
                                  {link.label != null && link.label && (
                                    <span
                                      className={cn(
                                        'ml-auto text-xs font-medium transition-colors',
                                        isActive
                                          ? 'text-text-primary'
                                          : 'text-text-tertiary group-hover:text-text-secondary',
                                      )}
                                    >
                                      {link.label}
                                    </span>
                                  )}
                                </Button>
                              </AccordionPrimitive.Trigger>
                            </AccordionPrimitive.Header>
                          }
                        />

                        <AccordionContent className="w-full text-text-primary">
                          {link.Component && <link.Component />}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Nav({ links, isCollapsed, resize, defaultActive }: NavProps) {
  return (
    <ActivePanelProvider defaultActive={defaultActive}>
      <NavContent links={links} isCollapsed={isCollapsed} resize={resize} />
    </ActivePanelProvider>
  );
}
