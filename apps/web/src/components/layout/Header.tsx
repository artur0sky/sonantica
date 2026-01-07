/**
 * Header Component
 *
 * Application header with global search and navigation.
 */

import { Link, useLocation } from "wouter";
import { IconSettings, IconLogout } from "@tabler/icons-react";
import { motion } from "framer-motion";
import {
  SearchBar as GlobalSearchBar,
  UserButton,
  ContextMenu,
  useContextMenu,
  useUIStore,
  type ContextMenuItem,
} from "@sonantica/ui";
import { useHeaderLogic } from "../../hooks/useHeaderLogic";
import logo from "../../assets/logo.png";

export function Header() {
  const { toggleLeftSidebar, handleSearchResultSelect } = useHeaderLogic();
  const [, setLocation] = useLocation();
  const contextMenu = useContextMenu("user-menu");
  const isPlayerExpanded = useUIStore((s) => s.isPlayerExpanded);

  // User menu items
  const userMenuItems: ContextMenuItem[] = [
    {
      id: "settings",
      label: "Settings",
      icon: <IconSettings size={18} stroke={1.5} />,
      onClick: () => setLocation("/settings"),
    },
    {
      id: "divider-1",
      label: "",
      divider: true,
      onClick: () => {},
    },
    {
      id: "logout",
      label: "Logout",
      icon: <IconLogout size={18} stroke={1.5} />,
      onClick: () => {
        // TODO: Implement logout
        console.log("Logout");
      },
      variant: "danger",
    },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: isPlayerExpanded ? -80 : 0,
          opacity: isPlayerExpanded ? 0 : 1,
          height: isPlayerExpanded ? 0 : undefined,
          minHeight: isPlayerExpanded ? 0 : undefined,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`h-14 sm:h-16 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 select-none transition-all duration-300 ${
          isPlayerExpanded
            ? "z-0 pointer-events-none"
            : "z-30 bg-surface border-b border-border"
        }`}
      >
        {/* Left: Logo (Toggles Sidebar) */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/">
            <a
              className="flex items-center gap-2 group cursor-pointer px-2 py-1 rounded-lg hover:bg-surface-elevated transition-all active:scale-95"
              onClick={() => {
                // Toggle sidebar on click
                toggleLeftSidebar();
              }}
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0"
              >
                <img
                  src={logo}
                  alt="Sonántica Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <span className="text-lg sm:text-xl font-bold tracking-tight group-hover:text-accent transition-colors hidden sm:inline">
                Sonántica
              </span>
            </a>
          </Link>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto min-w-0">
          <GlobalSearchBar onResultSelect={handleSearchResultSelect} />
        </div>

        {/* Right: User Button with Menu */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
          <UserButton
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              if (contextMenu.isOpen) {
                contextMenu.close();
              } else {
                contextMenu.handleContextMenu(e as any);
              }
            }}
            onMouseDown={(e: React.MouseEvent) => {
              // Prevent mousedown from closing the menu via ContextMenu's click-outside handler
              // when we actually want to toggle it via the onClick handler
              if (contextMenu.isOpen) {
                e.stopPropagation();
              }
            }}
          />
        </div>
      </motion.header>

      {/* User Menu */}
      <ContextMenu
        items={userMenuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={contextMenu.close}
      />
    </>
  );
}
