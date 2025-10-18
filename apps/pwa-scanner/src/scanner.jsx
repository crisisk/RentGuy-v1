import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export default function Scanner(){
  const videoRef = useRef(null)
  const [result, setResult] = useState('')
  const [direction, setDirection] = useState('out')
  const [projectId, setProjectId] = useState('1')
  const [qty, setQty] = useState(1)

  useEffect(()=>{
    const codeReader = new BrowserMultiFormatReader()
    codeReader.decodeFromVideoDevice(null, videoRef.current, (res, err)=>{
      if (res) setResult(res.getText())
    })
    return ()=> codeReader.reset()
  }, [])

  async function submit(){
    if(!result) return
    const payload = { tag_value: result, direction, project_id: parseInt(projectId,10), qty }
    await axios.post(`${API}/api/v1/warehouse/scan`, payload, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')||''}` } })
    alert('Beweging geregistreerd.')
    setResult('')
  }

  return (
    <div style={{fontFamily:'system-ui', padding: 12}}>
      <h2>Rentguy – QR Scanner</h2>
      <video ref={videoRef} style={{width:'100%', maxWidth:480, background:'#000'}} />
      <p>Gescand: <b>{result}</b></p>
      <div>
        <label>Project ID: <input value={projectId} onChange={e=>setProjectId(e.target.value)} /></label>
        <label style={{marginLeft:12}}>Qty: <input type="number" value={qty} onChange={e=>setQty(parseInt(e.target.value,10))} /></label>
      </div>
      <div style={{margin:'8px 0'}}>
        <label><input type="radio" name="dir" value="out" checked={direction==='out'} onChange={()=>setDirection('out')} /> Uit</label>
        <label style={{marginLeft:12}}><input type="radio" name="dir" value="in" checked={direction==='in'} onChange={()=>setDirection('in')} /> In</label>
      </div>
      <button onClick={submit} disabled={!result}>Boek beweging</button>
    </div>
  )
}
