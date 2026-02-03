export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
            type="button"
          >
            x
          </button>
        </div>

        <div className="px-4 py-4">{children}</div>

        {footer && <div className="border-t px-4 py-3 bg-gray-50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}
