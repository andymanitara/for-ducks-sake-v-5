import React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
type ToasterProps = React.ComponentProps<typeof Sonner>
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
        if (event.target instanceof HTMLElement) {
            // If clicking inside a toast but NOT on a button (action), dismiss
            if (event.target.closest('[data-sonner-toast]') && !event.target.closest('button')) {
                toast.dismiss();
            }
        }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  return (
    <>
      {/* Force override for toast styles to ensure visibility and branding */}
      <style>{`
        [data-sonner-toast] [data-description] {
          color: #000000 !important;
          opacity: 1 !important;
          font-weight: 700 !important;
        }
        /* Aggressively force green button style for actions (e.g. Shop) */
        [data-sonner-toast] [data-button] {
          background-color: #22c55e !important; /* green-500 */
          color: #ffffff !important;
          border: 2px solid #000000 !important;
          font-family: 'Rubik Mono One', sans-serif !important;
        }
        [data-sonner-toast] [data-button]:hover {
          background-color: #16a34a !important; /* green-600 */
        }
        /* Style the close button to match the theme */
        [data-sonner-toast] [data-close-button] {
            background-color: #f3f4f6 !important;
            border: 2px solid #000000 !important;
            color: #000000 !important;
            transition: all 0.2s ease;
        }
        [data-sonner-toast] [data-close-button]:hover {
            background-color: #e5e7eb !important;
            transform: scale(1.1);
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        closeButton={false}
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-4 group-[.toaster]:border-black group-[.toaster]:shadow-hard group-[.toaster]:font-arcade group-[.toaster]:rounded-xl group-[.toaster]:p-4 cursor-pointer",
            description: "group-[.toast]:!text-black font-arcade font-bold !opacity-100",
            actionButton:
              "bg-green-500 hover:bg-green-600 text-white font-arcade border-2 border-black shadow-sm",
            cancelButton:
              "bg-gray-100 text-black font-arcade border-2 border-black hover:bg-gray-200",
            error: "group-[.toaster]:bg-red-100 group-[.toaster]:text-red-900 group-[.toaster]:border-red-500",
            success: "group-[.toaster]:bg-green-100 group-[.toaster]:text-green-900 group-[.toaster]:border-green-500",
            warning: "group-[.toaster]:bg-yellow-100 group-[.toaster]:text-yellow-900 group-[.toaster]:border-yellow-500",
            info: "group-[.toaster]:bg-blue-100 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-500",
          },
        }}
        {...props}
      />
    </>
  )
}
export { Toaster }