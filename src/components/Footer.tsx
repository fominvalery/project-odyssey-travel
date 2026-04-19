import { Link } from "react-router-dom"
import Icon from "@/components/ui/icon"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-16">
      {/* Основной блок */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Логотип и описание */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Building2" size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Кабинет-24</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Платформа коммерческой недвижимости
          </p>
        </div>

        {/* Основные разделы */}
        <div>
          <h4 className="text-white font-semibold mb-4">Основные разделы</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/marketplace" className="hover:text-white transition-colors">Маркетплейс</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Личный кабинет</Link></li>
            <li><Link to="/referral" className="hover:text-white transition-colors">Реферальная программа</Link></li>
            <li><Link to="/ecosystem" className="hover:text-white transition-colors">Экосистема</Link></li>
          </ul>
        </div>

        {/* Юридическая информация */}
        <div>
          <h4 className="text-white font-semibold mb-4">Юридическая информация</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/terms" className="hover:text-white transition-colors">Пользовательское соглашение</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link></li>
            <li><Link to="/offer" className="hover:text-white transition-colors">Публичная оферта</Link></li>
            <li><Link to="/ai-rules" className="hover:text-white transition-colors">Правила использования ИИ</Link></li>
            <li><Link to="/consent" className="hover:text-white transition-colors">Согласие на рассылку</Link></li>
          </ul>
        </div>

        {/* Реквизиты */}
        <div>
          <h4 className="text-white font-semibold mb-4">Реквизиты оператора</h4>
          <ul className="space-y-1.5 text-sm text-gray-400">
            <li className="text-gray-300 font-medium">ИП Фомин В.А.</li>
            <li>ИНН: 614702918553</li>
            <li>ОГРНИП: 322619600050324</li>
            <li className="text-xs leading-relaxed mt-2">
              Юридический адрес: 347805, Россия, г. Каменск-Шахтинский, ул. Ворошилова, д. 21, кв. 91
            </li>
          </ul>
        </div>
      </div>

      {/* Баннер-предупреждение */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold mb-1">Внимание!</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-2">
                Сайт/веб-приложение находится на стадии активной начальной разработки. В связи с этим возможны временные некорректности в работе, изменения в функционале и появление тестовых заявок. Приносим извинения за возможные неудобства.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Мы верим в потенциал этого проекта и приглашаем вас стать частью его успеха! Проект нуждается в финансировании для дальнейшего развития и продвижения. По вопросам условия инвестиции просим обращаться по контактам, указанным ниже.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя полоска */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div className="space-y-1">
            <p>© 2026 Кабинет-24. Платформа коммерческой недвижимости. Все права защищены.</p>
            <p className="flex items-center gap-1">
              <Icon name="Clock" size={12} />
              Часовой пояс: UTC+3 (Москва)
            </p>
          </div>
          <div className="flex items-center gap-5">
            <a href="mailto:fominconsulting@yandex.ru" className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <Icon name="Mail" size={13} />
              fominconsulting@yandex.ru
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}