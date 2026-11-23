;(function () {
  function getCurrentScript() {
    return (
      document.currentScript ||
      document.querySelector('script[src*="/embed.js"]')
    )
  }

  var initialScript = getCurrentScript()
  var defaultBaseUrl =
    initialScript && initialScript.src
      ? getScriptBaseUrl(initialScript)
      : window.location.origin + '/'

  function getOption(options, element, key) {
    if (options && options[key] !== undefined) return options[key]
    return element.dataset[key]
  }

  function getScriptBaseUrl(script) {
    return new URL('.', script.src).toString()
  }

  function normalizeBaseUrl(baseUrl) {
    var normalizedBaseUrl = String(baseUrl || defaultBaseUrl)
    if (!/[/?#]$/.test(normalizedBaseUrl)) {
      normalizedBaseUrl += '/'
    }
    return normalizedBaseUrl
  }

  function buildEmbedUrl(baseUrl, embedId, options) {
    var path = embedId ? 'embed/' + encodeURIComponent(embedId) : 'embed'
    var url = new URL(path, normalizeBaseUrl(baseUrl))
    Object.keys(options || {}).forEach(function (key) {
      var value = options[key]
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
    return url.toString()
  }

  function mount(target, options) {
    var element =
      typeof target === 'string' ? document.querySelector(target) : target
    if (!element) return null

    var script = getCurrentScript()
    var baseUrl =
      getOption(options, element, 'baseUrl') ||
      (script && script.src ? getScriptBaseUrl(script) : defaultBaseUrl)
    var embedId = getOption(options, element, 'embedId')
    var height = getOption(options, element, 'height') || '640'
    var iframe = document.createElement('iframe')

    iframe.src = buildEmbedUrl(baseUrl, embedId, {
      characterName: getOption(options, element, 'characterName'),
      userDisplayName: getOption(options, element, 'userDisplayName'),
      systemPrompt: getOption(options, element, 'systemPrompt'),
      modelType: getOption(options, element, 'modelType'),
      selectedVrmPath: getOption(options, element, 'selectedVrmPath'),
      selectedLive2DPath: getOption(options, element, 'selectedLive2DPath'),
      selectedPNGTuberPath: getOption(options, element, 'selectedPNGTuberPath'),
      selectedLivlivPath: getOption(options, element, 'selectedLivlivPath'),
      showAssistantText: getOption(options, element, 'showAssistantText'),
      showCharacterName: getOption(options, element, 'showCharacterName'),
      showPresetQuestions: getOption(options, element, 'showPresetQuestions'),
      presetQuestions: getOption(options, element, 'presetQuestions'),
      colorTheme: getOption(options, element, 'colorTheme'),
      backgroundImageUrl: getOption(options, element, 'backgroundImageUrl'),
    })
    iframe.title =
      getOption(options, element, 'title') || 'AITuberKit conversation'
    iframe.allow = 'microphone; camera; autoplay'
    iframe.loading = getOption(options, element, 'loading') || 'lazy'
    iframe.style.width = getOption(options, element, 'width') || '100%'
    iframe.style.height = /^\d+$/.test(String(height)) ? height + 'px' : height
    iframe.style.border = '0'
    iframe.style.borderRadius = getOption(options, element, 'radius') || '12px'
    iframe.style.overflow = 'hidden'

    element.innerHTML = ''
    element.appendChild(iframe)
    return iframe
  }

  window.AITuberKitEmbed = {
    mount: mount,
  }

  function autoMount() {
    document
      .querySelectorAll('[data-aituber-kit-embed]')
      .forEach(function (element) {
        mount(element, {})
      })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true })
  } else {
    autoMount()
  }
})()
