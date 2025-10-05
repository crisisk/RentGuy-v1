import React, { useEffect, useState } from 'react'
import { getTips } from './onbApi.js'

export default function TipBanner({ module }){
  const [tip, setTip] = useState(null)
  useEffect(()=>{
    (async()=>{
      const tips = await getTips(module)
      if (tips.length) setTip(tips[0])
    })()
  }, [module])
  if (!tip) return null
  return (
    <div style={{padding:12, background:'#ecfeff', border:'1px solid #a5f3fc', borderRadius:8, margin:'8px 0', fontFamily:'system-ui'}}>
      <b>Tip:</b> {tip.message} {tip.cta && <button style={{marginLeft:8}}>{tip.cta}</button>}
    </div>
  )
}
