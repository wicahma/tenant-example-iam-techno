"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
}

export const Card = ({
  children,
  className = "",
  title,
  description,
  footer,
}: CardProps) => {
  return (
    <div
      className={`
        rounded-xl border border-gray-200 bg-white shadow-sm
        dark:border-gray-700 dark:bg-gray-900
        ${className}
      `.trim()}
    >
      {(title || description) && (
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};
