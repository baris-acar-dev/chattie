'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, CpuChipIcon, CloudIcon } from '@heroicons/react/24/outline'

interface Model {
  name: string
  provider: 'ollama' | 'gemini' | 'openai'
  displayName?: string
  size?: number
}

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  onModelChange: (model: string) => void
}

export default function ModelSelector({ models, selectedModel, onModelChange }: ModelSelectorProps) {
  const selectedModelData = models.find(m => m.name === selectedModel)

  const isCloudProvider = (provider: string) => {
    return provider === 'gemini' || provider === 'openai'
  }

  if (models.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <CpuChipIcon className="w-4 h-4" />
          <span>No models available</span>
        </div>
        <p className="text-xs mt-1">
          Please install Ollama models first
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <Listbox value={selectedModel} onChange={onModelChange}>
        <div className="relative">          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <span className="flex items-center">
              {isCloudProvider(selectedModelData?.provider ?? '') ? (
                <CloudIcon className="w-4 h-4 text-blue-500 mr-2" />
              ) : (
                <CpuChipIcon className="w-4 h-4 text-gray-400 mr-2" />
              )}
              <span className="block truncate text-sm">
                {selectedModelData?.displayName || selectedModelData?.name || selectedModel}
              </span>              {selectedModelData?.provider && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                   isCloudProvider(selectedModelData.provider)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {isCloudProvider(selectedModelData.provider) ? 'Cloud' : 'Local'}
                </span>
              )}
            </span>            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 dark:ring-opacity-50 focus:outline-none sm:text-sm">
              {models.map((model) => (
                <Listbox.Option
                  key={model.name}                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'
                    }`
                  }
                  value={model.name}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {model.provider === 'gemini' ? (
                              <CloudIcon className="w-4 h-4 text-blue-500 mr-2" />
                            ) : (
                              <CpuChipIcon className="w-4 h-4 text-gray-400 mr-2" />
                            )}
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {model.displayName || model.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 ml-6">                            {model.size && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Size: {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                              </span>
                            )}
                          </div>
                        </div>                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          isCloudProvider(model.provider) 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          {isCloudProvider(model.provider) ? 'Cloud' : 'Local'}
                        </span>
                      </div>                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                          <CheckIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}
