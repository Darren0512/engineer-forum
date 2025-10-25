
'use client';
import React from 'react';
export const Button = ({ children, onClick, variant='default', disabled, className='' }:
  {children:React.ReactNode, onClick?:()=>void, variant?:'default'|'ghost'|'outline'|'danger'|'primary', disabled?:boolean, className?:string}) => {
  const cls = `btn ${variant==='ghost'?'ghost':variant==='danger'?'danger':variant==='primary'?'primary':''} ${className||''}`;
  return <button className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
};
export const Card: React.FC<{children:React.ReactNode, className?:string}> = ({children, className=''}) => (
  <div className={`card ${className}`}>{children}</div>
);
export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`input ${props.className||''}`} />;
export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`textarea ${props.className||''}`} />;
export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`select ${props.className||''}`} />;
