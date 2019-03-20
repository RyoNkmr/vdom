type Neko = VNode | string
type NodeName = keyof ElementTagNameMap
type Attributes = { [key: string]: string | Function }

export interface VNode {
  nodeName: NodeName
  attributes: Attributes
  children: Neko[]
}

export const createVNode = (
  nodeName: NodeName,
  attributes: Attributes,
  ...children: Neko[]
): VNode => ({ nodeName, attributes, children })

const isVNode = (neko: Neko): neko is VNode => typeof neko !== 'string'
const eventHandlerAttributeRegexp = /^on(\w+)$/

const setAttributes = (element: HTMLElement, attributes: Attributes) =>
  Object.entries(attributes).forEach(([attribute, value]) => {
    const [, eventName = null] =
      eventHandlerAttributeRegexp.exec(attribute) || []
    eventName === null
      ? element.setAttribute(attribute, value as string)
      : element.addEventListener(eventName, value as EventListener)
  })

export const createRealElement = (neko: Neko): HTMLElement | Text => {
  if (!isVNode(neko)) {
    return document.createTextNode(neko)
  }

  const { nodeName, attributes, children } = neko
  const element = document.createElement(nodeName)
  setAttributes(element, attributes)

  if (children.length > 0) {
    const childrenElements = children.reduce(
      (fragment, koneko: Neko) =>
        fragment.appendChild(createRealElement(koneko)) && fragment,
      document.createDocumentFragment()
    )
    element.appendChild(childrenElements)
  }
  return element
}

enum Diff {
  None,
  Type,
  Text,
  Node,
  Value,
  Attribute,
}

interface UpdaterArguments {
  parentElement: HTMLElement
  currentNode: Node | HTMLElement | HTMLInputElement
  currentNeko: Neko
  nextNeko: Neko
}

type Updater = (UpdaterArguments) => void
const replaceElement: Updater = ({ parentElement, currentNode, nextNeko }) =>
  parentElement.replaceChild(createRealElement(nextNeko), currentNode)
const updateValue: Updater = ({ currentNode, nextNeko }) =>
  (currentNode.value = nextNeko.attributes.value)
const updateAttributes: Updater = ({
  currentNode,
  currentNeko: { attributes: currentAttributes },
  nextNeko: { attributes: nextAttributes },
}) => {
  Object.keys(currentAttributes)
    .filter(
      attributeName =>
        !eventHandlerAttributeRegexp.test(attributeName) &&
        !nextAttributes.hasOwnProperty(attributeName)
    )
    .forEach(attributeName => {
      currentNode.removeAttribute(attributeName)
    })
  Object.keys(nextAttributes)
    .filter(attributeName => !eventHandlerAttributeRegexp.test(attributeName))
    .forEach(attributeName => {
      currentNode.setAttribute(attributeName, nextAttributes[
        attributeName
      ] as string)
    })
}

type DiffFinder = {
  type: Diff
  updater: Updater | void
  finder: (kitty: Neko, kitten: Neko) => boolean
}

const diffFinders: DiffFinder[] = [
  {
    type: Diff.Type,
    finder: (kitty, kitten) => typeof kitty !== typeof kitten,
    updater: replaceElement,
  },
  {
    type: Diff.Text,
    finder: (kitty, kitten) =>
      !isVNode(kitty) && !isVNode(kitten) && kitty !== kitten,
    updater: replaceElement,
  },
  {
    type: Diff.Node,
    finder: (kitty: VNode, kitten: VNode) => kitty.nodeName !== kitten.nodeName,
    updater: replaceElement,
  },
  {
    type: Diff.Value,
    finder: (kitty: VNode, kitten: VNode) =>
      kitty.attributes &&
      kitten.attributes &&
      kitty.attributes.value !== kitten.attributes.value,
    updater: updateValue,
  },
  {
    type: Diff.Attribute,
    finder: (kitty: VNode, kitten: VNode) =>
      JSON.stringify(kitty.attributes) !== JSON.stringify(kitten.attributes),
    updater: updateAttributes,
  },
  {
    type: Diff.None,
    finder: (kitty: VNode, kitten: VNode) => true,
    updater: null,
  },
]

const findUpdater = (kitty: Neko, kitten: Neko): Updater | void =>
  diffFinders.find(({ finder }) => finder(kitty, kitten)).updater

const takeLonger = (one, theOther) =>
  one.length > theOther.length ? one : theOther

export const updateRealElement: Updater = ({
  parentElement,
  currentNode,
  currentNeko,
  nextNeko,
}): void => {
  if (!currentNeko) {
    parentElement.appendChild(createRealElement(nextNeko))
    return
  }
  if (!nextNeko) {
    parentElement.removeChild(currentNode)
    return
  }

  const updater = findUpdater(currentNeko, nextNeko)
  if (typeof updater === 'function') {
    return updater({ parentElement, currentNode, currentNeko, nextNeko })
  }

  if (isVNode(currentNeko) && isVNode(nextNeko)) {
    takeLonger(currentNeko.children, nextNeko.children).forEach((_, index) =>
      updateRealElement({
        parentElement: currentNode as HTMLElement,
        currentNode: currentNode.childNodes[index],
        currentNeko: currentNeko.children[index],
        nextNeko: nextNeko.children[index],
      })
    )
  }
}
