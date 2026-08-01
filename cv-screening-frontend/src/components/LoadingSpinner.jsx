import React from 'react'

const LoadingSpinner = ({ label = 'LOADING...', fullScreen = false }) => {
  return (
    <div className={`${fullScreen ? 'min-h-[70vh]' : 'min-h-[220px]'} flex items-center justify-center`}>
      <div className="rounded-2xl bg-black/95 px-10 py-8 text-center shadow-2xl">
        <div className="mx-auto h-28 w-28 rounded-full border-[10px] border-white/85 border-r-white/20 animate-spin" />
        <p className="mt-5 text-3xl font-light tracking-widest text-white">{label}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
