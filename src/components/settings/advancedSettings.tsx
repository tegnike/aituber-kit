import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from '@heroicons/react/24/solid'
import { useTranslation } from 'react-i18next'

import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const AdvancedSettings = () => {
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const changeEnglishToJapanese = settingsStore(
    (s) => s.changeEnglishToJapanese
  )
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const showAssistantText = settingsStore((s) => s.showAssistantText)
  const showCharacterName = settingsStore((s) => s.showCharacterName)

  const { t } = useTranslation()

  return (
    <div className="my-40">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center w-full pr-4 py-2 text-sm font-medium text-left text-purple-900 bg-purple-100 rounded-lg hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
              <div className="flex items-center flex-grow">
                <span className="typography-20 font-bold mr-8">
                  {t('AdvancedSettings')}
                </span>
                <ChevronUpIcon
                  className={`${
                    open ? 'transform rotate-180' : ''
                  } w-[20px] h-[20px] text-purple-500 flex-shrink-0`}
                />
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
              <div className="pl-16">
                <div className="my-24">
                  <div className="my-16 typography-16 font-bold">
                    {t('ShowAssistantText')}
                  </div>
                  <div className="my-8">
                    <TextButton
                      onClick={() =>
                        settingsStore.setState((s) => ({
                          showAssistantText: !s.showAssistantText,
                        }))
                      }
                    >
                      {showAssistantText ? t('StatusOn') : t('StatusOff')}
                    </TextButton>
                  </div>
                </div>
                <div className="my-24">
                  <div className="my-16 typography-16 font-bold">
                    {t('ShowCharacterName')}
                  </div>
                  <div className="my-8">
                    <TextButton
                      onClick={() =>
                        settingsStore.setState((s) => ({
                          showCharacterName: !s.showCharacterName,
                        }))
                      }
                    >
                      {showCharacterName ? t('StatusOn') : t('StatusOff')}
                    </TextButton>
                  </div>
                </div>
                {selectLanguage === 'ja' && (
                  <div className="my-24">
                    <div className="my-16 typography-16 font-bold">
                      {t('EnglishToJapanese')}
                    </div>
                    <div className="my-8">
                      <TextButton
                        onClick={() =>
                          settingsStore.setState((prevState) => ({
                            changeEnglishToJapanese:
                              !prevState.changeEnglishToJapanese,
                          }))
                        }
                      >
                        {t(changeEnglishToJapanese ? 'StatusOn' : 'StatusOff')}
                      </TextButton>
                    </div>
                  </div>
                )}
                <div className="my-24">
                  <div className="my-16 typography-16 font-bold">
                    {t('ShowControlPanel')}
                  </div>
                  <div className="my-16 typography-16">
                    {t('ShowControlPanelInfo')}
                  </div>
                  <div className="my-8">
                    <TextButton
                      onClick={() =>
                        settingsStore.setState({
                          showControlPanel: !showControlPanel,
                        })
                      }
                    >
                      {showControlPanel ? t('StatusOn') : t('StatusOff')}
                    </TextButton>
                  </div>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  )
}
export default AdvancedSettings
