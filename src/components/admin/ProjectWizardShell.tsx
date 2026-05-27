import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { STEPS } from "./projectWizardData"

interface Props {
  step: number
  saving: boolean
  uploadingPhoto: boolean
  projectType: string
  onBack: () => void
  onNext: () => void
  onPublish: () => void
  children: React.ReactNode
}

export default function ProjectWizardShell({
  step, saving, uploadingPhoto, projectType,
  onBack, onNext, onPublish, children,
}: Props) {
  const isLastStep = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Новый проект</h1>
            <p className="text-xs text-gray-500 mt-0.5">База / Проекты Кабинет-24</p>
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex items-center gap-0 mb-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                i === step ? "bg-amber-600 text-white" :
                i < step ? "text-amber-400" : "text-gray-500"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step ? "bg-amber-500 text-white" :
                  i === step ? "bg-white text-amber-600" : "bg-[#1f1f1f] text-gray-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px min-w-2 ${i < step ? "bg-amber-500/40" : "bg-[#1f1f1f]"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-8">Шаг {step + 1} из {STEPS.length}</p>

        {/* Контент шага */}
        {children}

        {/* Навигация */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#1f1f1f]">
          <Button onClick={onBack} variant="ghost" className="text-gray-400 hover:text-white">
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            {step === 0 ? "Отмена" : "Назад"}
          </Button>

          {isLastStep ? (
            <Button
              onClick={onPublish}
              disabled={saving || uploadingPhoto}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              {saving
                ? <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Сохраняю...</>
                : <><Icon name="Check" className="h-4 w-4 mr-2" />Опубликовать проект</>
              }
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={step === 0 && !projectType}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              Далее
              <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
