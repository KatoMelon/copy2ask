import { useRef, useState } from 'react'

import { Button } from './components/ui/button'
import {
  BeachUmbrella,
  Clipboard,
  Close,
  Comment,
  ElectronicLocksClose,
  GithubOne,
  Help,
  LoadingFour,
  Lock,
  Minus,
  PointOut,
  Pushpin,
  SettingTwo,
} from '@icon-park/react'
import { Toggle } from './components/ui/toggle'
import {
  ClipboardGetText,
  ClipboardSetText,
  Quit,
  WindowMinimise,
  WindowSetAlwaysOnTop,
} from '../wailsjs/runtime/runtime'
import { Textarea } from './components/ui/textarea'
import { Label } from './components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { Input } from './components/ui/input'

import OpenAI from 'openai'
import { useToast } from './components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './components/ui/alert-dialog'

const App = () => {
  // 窗口状态是否置顶
  const [isPinned, setIsPinned] = useState(false)
  // 用户提问文本内容
  const [askText, setAskText] = useState('')
  // AI回答文本内容
  const [answerText, setAnswerText] = useState('')
  // API Key & Base URL
  const initApiKey = localStorage.getItem('copy2ask:apikey') ? localStorage.getItem('copy2ask:apikey')! : ''
  const initBaseUrl = localStorage.getItem('copy2ask:baseurl') ? localStorage.getItem('copy2ask:baseurl')! : ''
  const [apiKey, setApiKey] = useState(initApiKey)
  const [baseUrl, setBaseUrl] = useState(initBaseUrl)
  // 是否为加载状态
  const [isChatLoading, setIsChatLoading] = useState(false)
  // 模板锁定相关
  const [isTemplateLocked, setIsTemplateLocked] = useState(false)
  const [templateContent, setTemplateContent] = useState('')
  const [templateStartPoint, setTemplateStartPoint] = useState(0)

  const { toast } = useToast()

  const askInputRef = useRef<HTMLTextAreaElement>(null)

  const changeApiKey = (apikey: string) => {
    localStorage.setItem('copy2ask:apikey', apikey)
    setApiKey(apikey)
  }
  const changeBaseUrlKey = (baseurl: string) => {
    localStorage.setItem('copy2ask:baseurl', baseurl)
    setBaseUrl(baseurl)
  }

  const changeIsPinned = () => {
    WindowSetAlwaysOnTop(!isPinned)
    setIsPinned(!isPinned)
  }

  const chatSetup = (prompts: string) => {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl ? baseUrl : 'https://api.openai.com',
      dangerouslyAllowBrowser: true,
    })
    return new Promise((resolve, reject) => {
      openai.chat.completions
        .create({
          messages: [{ role: 'user', content: prompts }],
          model: 'gpt-3.5-turbo',
        })
        .then((chatCompletion) => {
          resolve(chatCompletion.choices[0].message.content)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const startAsk = () => {
    if (!isTemplateLocked) {
      setAnswerText('')
      if (!askText) {
        ClipboardGetText().then((result) => {
          setAskText(result as string)
        })
      }
      if (askText) {
        setIsChatLoading(true)
        chatSetup(askText)
          .then((result) => {
            setAnswerText(result as string)
            ClipboardSetText(result as string)
            setIsChatLoading(false)
          })
          .catch((error) => {
            setIsChatLoading(false)
            toast({
              title: '错误',
              description: error.message,
              variant: 'destructive',
            })
            console.error(error)
          })
      }
    } else {
      setIsChatLoading(true)
      ClipboardGetText().then((result: string) => {
        const prompts =
          templateContent.substring(0, templateStartPoint) + result + templateContent.substring(templateStartPoint)
        setAskText(prompts)
        chatSetup(prompts)
          .then((result) => {
            setAnswerText(result as string)
            ClipboardSetText(result as string)
            setIsChatLoading(false)
          })
          .catch((error) => {
            setIsChatLoading(false)
            toast({
              title: '错误',
              description: error.message,
              variant: 'destructive',
            })
            console.error(error)
          })
      })
    }
  }

  const lockTemplate = () => {
    setIsTemplateLocked(true)
    setTemplateContent(askText)
    setTemplateStartPoint(askInputRef.current?.selectionStart as number)
    setAskText(
      askText.substring(0, askInputRef.current?.selectionStart) +
        '【粘贴的内容将被插入到这里】' +
        askText.substring(askInputRef.current?.selectionStart!)
    )
  }

  const unlockTemplate = () => {
    setIsTemplateLocked(false)
    setTemplateContent('')
    setTemplateStartPoint(0)
    setAskText(templateContent)
  }

  return (
    <div id='App'>
      {/* 标题栏 */}
      <div className='w-full h-fit flex flex-row-reverse items-center p-2 draggable'>
        <Button
          onClick={() => Quit()}
          variant={'ghost'}
          className='h-[24px] w-[24px] flex items-center ml-1 justify-center'
        >
          <Close size={14}></Close>
        </Button>
        <Button
          onClick={() => WindowMinimise()}
          variant={'ghost'}
          className='h-[24px] w-[24px] flex items-center ml-3 justify-center'
        >
          <Minus size={14}></Minus>
        </Button>
        <Toggle
          pressed={isPinned}
          onPressedChange={changeIsPinned}
          className='h-[24px] w-[24px] flex items-center ml-3 justify-center'
        >
          <Pushpin size={14}></Pushpin>
        </Toggle>
      </div>
      {/* 业务面板 */}
      <div className='w-full p-2 flex flex-col' style={{ height: 'calc(100% - 41px)' }}>
        <div className='w-full h-full pl-3 pr-3 pb-3 flex flex-col'>
          {apiKey ? null : (
            <Alert variant={'destructive'} className='mb-2 font-bold border-2 border-red-400'>
              <InfoCircledIcon className='h-4 w-4' />
              <AlertTitle className='font-bold'>注意</AlertTitle>
              <AlertDescription>未配置 GPT 服务 Api Key.</AlertDescription>
            </Alert>
          )}
          <Textarea
            readOnly={isTemplateLocked}
            ref={askInputRef}
            className='h-full resize-none'
            placeholder='输入待提问的文本'
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
          />
          <div className='w-full h-fit flex flex-row pt-3 pb-3'>
            {' '}
            <Button
              variant={'outline'}
              onClick={() =>
                askText === ''
                  ? toast({
                      title: '提示',
                      description: '请先输入模板，再锁定插入点',
                    })
                  : isTemplateLocked
                  ? unlockTemplate()
                  : lockTemplate()
              }
            >
              {isTemplateLocked ? (
                <Lock size={17} className='mr-2 h-4 w-4' />
              ) : (
                <PointOut size={17} className='mr-2 h-4 w-4' />
              )}
              {isTemplateLocked ? '模板已锁定' : '确定粘贴点'}
            </Button>
            <Button disabled={isChatLoading} className='w-full ml-2' onClick={startAsk}>
              {isChatLoading ? (
                <LoadingFour size={17} className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Comment size={17} className='mr-2 h-4 w-4' />
              )}
              <span className='font-bold'>
                {isTemplateLocked ? '粘贴到模板并提问' : askText ? '开始提问' : '从剪切板粘贴'}
              </span>
            </Button>
          </div>
          <Textarea readOnly className='h-full resize-none' value={answerText} placeholder='回答将展示在这里' />
        </div>
        {/* 底部设置按钮 */}
        <div className='w-full flex-row pl-3 pr-3 pb-2'>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={'secondary'} style={{ width: 'calc(50% - 6px)', marginRight: '12px' }}>
                <SettingTwo theme='filled' size={17} className='mr-2 h-4 w-4' />{' '}
                <span className='font-bold'>基础配置</span>
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>编辑基础配置</DialogTitle>
                {/* <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription> */}
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='name' className='text-right'>
                    BaseURL
                  </Label>
                  <Input value={baseUrl} onChange={(e) => changeBaseUrlKey(e.target.value)} className='col-span-3' />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='username' className='text-right'>
                    Api Key
                  </Label>
                  <Input
                    value={apiKey}
                    type='password'
                    onChange={(e) => changeApiKey(e.target.value)}
                    className='col-span-3'
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant={'secondary'} style={{ width: 'calc(50% - 6px)' }}>
                <Help theme='filled' size={17} className='mr-2 h-4 w-4' /> <span className='font-bold'>怎样使用</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>说明</AlertDialogTitle>
                <AlertDialogDescription className='text-left leading-6'>
                  1. 在基础配置中填写 Api Key 与 BaseURL，BaseURL 留空默认指向 Openai 地址。
                  <br />
                  2. 编写你的提示词模板。你可以随时点击右侧的开始提问按钮测试提问效果。
                  <br />
                  3.
                  提示词模板编写完成后，将鼠标光标放到提问框中希望插入文字的位置，随后点击锁定粘贴点按钮。此时提问框被锁定
                  <br />
                  4. 复制需要插入到模板中的内容，点击“粘贴到模板并提问”。得到的答案在生成完毕后会自动复制到剪切板。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>好的</AlertDialogCancel>
                <AlertDialogAction>
                  <GithubOne size={16} className='mr-2' />
                  带我去 GitHub
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

export default App
