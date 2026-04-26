import Icon from "@/components/ui/icon"

interface DealTypePickerProps {
  dealType: string
  onSelect: (v: string) => void
  containerRef?: React.RefObject<HTMLDivElement>
}

export default function DealTypePicker({ dealType, onSelect, containerRef }: DealTypePickerProps) {
  return (
    <div ref={containerRef} className="rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] p-5">
      <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">Что планируете?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelect("sale")}
          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
            dealType === "sale"
              ? "border-blue-500 bg-blue-500/10 text-white"
              : "border-[#2a2a2a] bg-[#111] text-gray-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            dealType === "sale" ? "bg-blue-500/20" : "bg-[#1a1a1a]"
          }`}>
            <Icon name="Tag" className={`h-6 w-6 ${dealType === "sale" ? "text-blue-400" : "text-gray-500"}`} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">Продать</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Единоразовая сделка</p>
          </div>
        </button>
        <button
          onClick={() => onSelect("rent")}
          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
            dealType === "rent"
              ? "border-emerald-500 bg-emerald-500/10 text-white"
              : "border-[#2a2a2a] bg-[#111] text-gray-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            dealType === "rent" ? "bg-emerald-500/20" : "bg-[#1a1a1a]"
          }`}>
            <Icon name="KeyRound" className={`h-6 w-6 ${dealType === "rent" ? "text-emerald-400" : "text-gray-500"}`} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">Сдать в аренду</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Ежемесячный доход</p>
          </div>
        </button>
      </div>
    </div>
  )
}
