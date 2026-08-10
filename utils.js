const imagePromptFromLocalStorage =
  typeof localStorage !== "undefined" ? localStorage.getItem("imagePrompt") : null
const quotePromptFromLocalStorage =
  typeof localStorage !== "undefined" ? localStorage.getItem("quotePrompt") : null
const imageUrlFromLocalStorage =
  typeof localStorage !== "undefined" ? localStorage.getItem("imageUrl") : null
const quoteFromLocalStorage =
  typeof localStorage !== "undefined" ? localStorage.getItem("quote") : null
const quoteSpan =
  typeof document !== "undefined" ? document.querySelector(".quote-span") : null
const quoteWrapper =
  typeof document !== "undefined" ? document.querySelector(".quote-wrapper") : null
const nameSpan =
  typeof document !== "undefined" ? document.querySelector(".name-span") : null
const loader = typeof document !== "undefined" ? document.getElementById("loader") : null

function startLoading() {
  if (!nameSpan || !quoteWrapper || !loader) return

  nameSpan.style.display = "none"
  quoteWrapper.style.display = "none"
  loader.style.display = "block"
  document.body.backgroundImage = ""
}

function stopLoading(name, url, quote) {
  if (!nameSpan || !quoteWrapper || !loader || !quoteSpan) return

  nameSpan.style.display = "inline"
  quoteWrapper.style.display = "block"
  loader.style.display = "none"
  nameSpan.textContent = `${name} - ${getDate()}`
  document.body.style.backgroundImage = `url(${url})`
  quoteSpan.textContent = quote
}

export async function generateTextAndImage(
  name,
  favActivity,
  favPlace,
  temperature
) {
  startLoading()

  try {
    const url = await getImage(favPlace)
    const quote = await getQuote(favActivity, favPlace, temperature)
    stopLoading(name, url, quote)
  } catch (error) {
    console.error("Unable to generate content:", error)
    stopLoading(
      name,
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
      createFallbackQuote(favActivity, favPlace)
    )
  }

  return
}

function getDate() {
  const date = new Date()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const monthName = monthNames[monthIndex]

  return `${monthName} ${year}`
}

function createFallbackQuote(favActivity, favPlace) {
  return `A ${favActivity} beside ${favPlace} becomes a small, bright rebellion against the ordinary.`
}

async function getImage(query) {
  try {
    const response = await fetch(
      `https://apis.scrimba.com/unsplash/photos/random/?count=1&query=${query}`
    )

    if (response.ok) {
      const data = await response.json()
      return data[0].urls.full
    }

    throw new Error(`Image request failed with status ${response.status}`)
  } catch (error) {
    console.error("Image error:", error)
    return "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80"
  }
}

async function getQuote(favActivity, favPlace, temperature) {
  let quotePrompt = `Create a poetic phrase about ${favActivity} and ${favPlace} in the insightful, witty and satirical style of Oscar Wilde. Omit Oscar Wilde's name.`

  if (quotePrompt === quotePromptFromLocalStorage && quoteFromLocalStorage) {
    return quoteFromLocalStorage
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem("quotePrompt", quotePrompt)
  }

  let body = {
    model: "text-davinci-003",
    prompt: quotePrompt,
    temperature: temperature,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }

  try {
    let res = await fetch("https://apis.scrimba.com/openai/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Quote request failed with status ${res.status}`)
    }

    let response = await res.json()
    let newQuote = response.choices?.[0]?.text?.trim()

    if (!newQuote) {
      throw new Error("No quote returned from the API")
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("quote", newQuote)
    }

    return newQuote
  } catch (error) {
    console.error("Quote error:", error)
    const fallbackQuote = createFallbackQuote(favActivity, favPlace)

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("quote", fallbackQuote)
    }

    return fallbackQuote
  }
}
