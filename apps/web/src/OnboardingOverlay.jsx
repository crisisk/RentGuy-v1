import React, { useEffect, useState } from 'react'
import { getSteps, getProgress, completeStep } from './onbApi.js'
import { api } from './api.js'

export default function OnboardingOverlay({ email, onClose }) {
  const [steps, setSteps] = useState([])
  const [done, setDone] = useState(new Set())

  useEffect(()=>{
    (async()=>{
      const s = await getSteps()
      setSteps(s)
      const p = await getProgress(email)
      setDone(new Set(p.filter(x=>x.status==='complete').map(x=>x.step_code)))
    })()
  }, [email])

  const progress = steps.length ? Math.round(100 * (done.size / steps.length)) : 0

  async function mark(step) {
    await completeStep(email, step.code)
    const p = await getProgress(email)
    setDone(new Set(p.filter(x=>x.status==='complete').map(x=>x.step_code)))
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', color:'#111', zIndex:9999}}>
      <div style={{maxWidth:720, margin:'60px auto', background:'#fff', borderRadius:12, padding:24, fontFamily:'system-ui'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>Welkom bij Rentguy ✨</h2>
          <button onClick={onClose}>Sluiten</button>
        </div>
        <div style={{margin:'8px 0', height:12, background:'#eee', borderRadius:6}}>
          <div style={{width: progress+'%', height:12, background:'#4ade80', borderRadius:6}}></div>
        </div>
        <p>Loop de stappen door voor een vliegende start. Markeer als voltooid zodra je klaar bent.</p>
        <ol>
          {steps.map(st => (
            <li key={st.code} style={{margin:'8px 0', padding:12, border:'1px solid #eee', borderRadius:8, background: done.has(st.code)?'#f0fff4':'#fff'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <b>{st.title}</b>
                  <div style={{color:'#555'}}>{st.description}</div>
                </div>
                {done.has(st.code) ? <span>✅ Gereed</span> : <button onClick={()=>mark(st)}>Markeer gereed</button>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
