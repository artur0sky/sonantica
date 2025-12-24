/**
 * Class Name Utility
 * 
 * Combines class names conditionally.
 * Lightweight alternative to clsx/classnames.
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((x) => typeof x === 'string')
    .join(' ')
    .trim();
}
