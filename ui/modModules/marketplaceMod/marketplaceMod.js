// Marketplace UI module: full-screen overlay that replaces the Repository tab.
// Data comes from the marketplaceMod Lua extension via guihooks events.

const CSS = `
#rfm{--bg:#0f1012;--s1:#17181c;--s2:#1f2126;--s3:#2a2d33;--line:#2c2f36;--tx:#f3f4f6;--tx2:#a8adb7;--tx3:#6f7580;
  --acc:#ff6600;--acc2:#ff8955;--acc3:#a54106;--accb:#da5706;--ok:#3ecf6e;--warn:#f5c04a;--bad:#ff5d52;--r:10px;
  position:fixed;inset:0;z-index:2147483001;background:var(--bg);color:var(--tx);
  font:14px/1.45 var(--fnt-defs,"Noto Sans"),"Noto Sans","Segoe UI",Arial,sans-serif;display:flex;flex-direction:column;
  opacity:0;visibility:hidden;transform:scale(.985);transition:opacity .22s ease,transform .22s ease,visibility 0s .22s}
#rfm.open{opacity:1;visibility:visible;transform:none;transition:opacity .22s ease,transform .22s ease}
#rfm *{box-sizing:border-box}
#rfm button{font:inherit}
#rfm ::-webkit-scrollbar{width:10px;height:10px}#rfm ::-webkit-scrollbar-thumb{background:#33363d;border-radius:var(--r1);border:2px solid var(--bg)}
#rfm ::-webkit-scrollbar-track{background:transparent}
#rfm .nav{display:flex;align-items:center;gap:16px;height:64px;padding:0 28px;background:rgba(15,16,18,.92);border-bottom:1px solid var(--line);flex:none}
#rfm .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:.4px;cursor:pointer;white-space:nowrap}
#rfm .brand i{width:28px;height:28px;border-radius:var(--r1);background:none;display:grid;place-items:center;font-style:normal;font-size:15px}
#rfm .brand b{color:var(--acc2);font-weight:800}
#rfm .tabs{display:flex;gap:4px}
#rfm .tab{white-space:nowrap;flex:none;padding:8px 14px;border-radius:var(--r1);color:var(--tx2);cursor:pointer;font-weight:600;transition:background .15s,color .15s}
#rfm .tab:hover{color:var(--tx);background:var(--s2)}#rfm .tab.on{color:var(--tx);background:var(--s3)}
#rfm .search{flex:1 1 320px;min-width:220px;max-width:560px;margin-left:auto;position:relative;cursor:text}
#rfm .search input{width:100%;height:40px;padding:0 16px 0 42px;border-radius:var(--r2);border:1px solid var(--line);background:var(--s1);color:var(--tx);font-size:14px;outline:none;transition:border-color .15s,background .15s}
#rfm .search input:focus{border-color:var(--acc);background:var(--s2)}
@media (max-width:1500px){#rfm .nav .cl2{display:none}#rfm .nav>.catp{max-width:110px}#rfm .brand{font-size:0;gap:0}#rfm .brand i{font-size:15px}}@media (max-width:1300px){#rfm .tab{padding:8px 10px}#rfm .nav{padding:0 16px;gap:12px}}
#rfm .search svg{position:absolute;left:14px;top:11px;width:18px;height:18px;color:var(--tx3);pointer-events:none}
#rfm .chipv{font-size:12px;font-weight:700;color:var(--ok);background:rgba(62,207,110,.12);border:1px solid rgba(62,207,110,.35);padding:5px 10px;border-radius:var(--r2);white-space:nowrap}
#rfm .classic{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:var(--tx3);cursor:pointer;white-space:nowrap;text-decoration:underline;text-underline-offset:3px}
#rfm .classic:hover{color:var(--tx)}
#rfm .phnote{font-size:12px;color:var(--tx3);margin-top:6px}
#rfm .close{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--tx2);font-size:20px;transition:background .15s,color .15s}
#rfm .close:hover{background:var(--s3);color:var(--tx)}
#rfm .page{flex:1;overflow-y:auto;overflow-x:hidden}
#rfm .wrap{max-width:1560px;margin:0 auto;padding:24px 32px 60px}
#rfm .fade{animation:rfmIn .28s ease both}
@keyframes rfmIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
#rfm img.im{opacity:0;transition:opacity .35s ease,transform .35s ease}#rfm img.im.ld{opacity:1}
#rfm .ph{background:var(--s2);position:relative;overflow:hidden}
#rfm .hero{display:grid;grid-template-columns:1fr 300px;gap:16px;margin-bottom:36px}
#rfm .hmain{position:relative;height:440px;border-radius:var(--r2);overflow:hidden;cursor:pointer;background:#000}
#rfm .hbg{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:none}
#rfm .himg{position:absolute;right:0;top:0;height:100%;width:68%;object-fit:cover;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%);mask-image:linear-gradient(90deg,transparent 0,#000 30%)}
#rfm .hshade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,12,.92) 0,rgba(10,10,12,.6) 40%,transparent 70%),linear-gradient(0deg,rgba(10,10,12,.7),transparent 45%)}
#rfm .htxt{position:absolute;left:40px;bottom:36px;max-width:520px;display:flex;flex-direction:column;gap:12px}
#rfm .eyebrow{font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:var(--acc2)}
#rfm .htitle{font-size:40px;line-height:1.08;font-weight:800;letter-spacing:-.5px;text-shadow:0 2px 12px rgba(0,0,0,.5)}
#rfm .hdesc{color:#d6d9df;font-size:15px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#rfm .hmeta{display:flex;gap:10px;flex-wrap:wrap;align-items:center;color:var(--tx2);font-size:13px}
#rfm .hcta{display:flex;gap:10px;margin-top:6px}
#rfm .hlist{display:flex;flex-direction:column;gap:6px}
#rfm .hli{display:flex;gap:12px;align-items:center;padding:8px;border-radius:var(--r1);cursor:pointer;position:relative;overflow:hidden;transition:background .15s;flex:1;min-height:0}
#rfm .hli:hover{background:var(--s2)}#rfm .hli.on{background:var(--s3)}
#rfm .hli .tn{width:92px;height:52px;border-radius:var(--r1);flex:none;object-fit:cover;background:#222}
#rfm .hli .nm{font-weight:600;font-size:13px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#rfm .hli .bar{position:absolute;left:0;bottom:0;height:2px;background:var(--acc);width:0}
#rfm .hli.on .bar{animation:rfmBar 7s linear forwards}
@keyframes rfmBar{to{width:100%}}
#rfm .hero.heroOff .hli.on .bar{animation-play-state:paused}
#rfm .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 18px;border-radius:var(--r1);border:0;cursor:pointer;font-weight:700;font-size:14px;transition:background .15s,transform .1s,box-shadow .15s;white-space:nowrap}
#rfm .btn:active{transform:none}
#rfm .btn.pri{background:var(--acc);color:var(--on,#fff);box-shadow:none}#rfm .btn.pri:hover{background:var(--acc2)}#rfm .btn.pri:active{background:var(--acc3)}
#rfm .btn.sec{background:rgba(255,255,255,.1);color:var(--tx)}#rfm .btn.sec:hover{background:rgba(255,255,255,.18)}
#rfm .btn.done{background:rgba(62,207,110,.15);color:var(--ok);box-shadow:none;cursor:default}
#rfm .btn.lg{height:48px;padding:0 28px;font-size:15px}
#rfm .shelf{margin:0 0 34px;position:relative}
#rfm .sh{display:flex;align-items:baseline;gap:14px;margin-bottom:14px}
#rfm .sh h3{margin:0;font-size:20px;font-weight:700;letter-spacing:-.2px}
#rfm .sh .sub{color:var(--tx3);font-size:13px}
#rfm .sh .all{margin-left:auto;color:var(--tx2);font-size:13px;font-weight:600;cursor:pointer}#rfm .sh .all:hover{color:var(--acc2)}
#rfm .rail{display:grid;grid-auto-flow:column;grid-auto-columns:var(--cw,calc((100% - 4*16px)/5));gap:16px;overflow-x:auto;overflow-y:hidden;padding:4px 2px 12px;scrollbar-width:none}
#rfm .rail::-webkit-scrollbar{display:none}
#rfm .pad{position:absolute;top:calc(50% + 6px);width:44px;height:44px;border-radius:50%;background:rgba(15,16,18,.85);border:1px solid var(--line);color:var(--tx);display:grid;place-items:center;cursor:pointer;opacity:0;transition:opacity .2s,background .15s;z-index:3;font-size:18px}
#rfm .shelf:hover .pad{opacity:1}#rfm .pad:hover{background:var(--acc)}
#rfm .pad.l{left:-20px}#rfm .pad.r{right:-20px}
#rfm .shelf .pad.off,#rfm .shelf:hover .pad.off{opacity:0;pointer-events:none;visibility:hidden}
#rfm .card{background:var(--s1);border-radius:var(--r);overflow:hidden;cursor:pointer;display:flex;flex-direction:column;transition:background .15s;min-width:0;contain:layout paint style}
#rfm .card:hover{background:var(--s2);outline:1px solid color-mix(in srgb,var(--acc) 55%,transparent);outline-offset:-1px}
#rfm .cimg{aspect-ratio:16/9;position:relative;overflow:hidden}
#rfm .cimg img{width:100%;height:100%;object-fit:cover;display:block}
#rfm .badge{position:absolute;left:10px;top:10px;font-size:11px;font-weight:800;letter-spacing:.3px;padding:4px 8px;border-radius:var(--r1)}
#rfm .b-current{background:rgba(62,207,110,.9);color:#05210f}#rfm .b-previous{background:rgba(245,192,74,.92);color:#2b1f00}
#rfm .b-outdated{background:rgba(255,93,82,.92);color:#2b0300}#rfm .b-unknown{background:rgba(120,125,135,.85);color:#111}
#rfm .pfx{position:absolute;right:10px;top:10px;font-size:10px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;padding:4px 7px;border-radius:var(--r1);background:rgba(0,0,0,.65);color:var(--acc2)}
#rfm .qsub{position:absolute;right:10px;bottom:10px;opacity:0;transition:opacity .15s;height:32px;padding:0 12px;font-size:12px}
#rfm .card:hover .qsub,#rfm .qsub.done{opacity:1;transform:none}
#rfm .cbody{padding:12px 14px 14px;display:flex;flex-direction:column;gap:5px}
#rfm .ct{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .ca{color:var(--tx3);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .cu{color:var(--tx2);font-size:12px;font-weight:600}#rfm .cu b{color:#8ec8ff;font-weight:700}
#rfm .cm{display:flex;gap:12px;align-items:center;font-size:12px;color:var(--tx2);margin-top:2px}
#rfm .st{color:#ffc24a;letter-spacing:1px;font-size:12px}
#rfm .ic{display:inline-flex;align-items:center;gap:4px}
#rfm .seg{display:inline-flex;background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:3px;margin-left:8px}
#rfm .seg span{padding:5px 12px;border-radius:var(--r2);font-size:12px;font-weight:600;color:var(--tx2);cursor:pointer;transition:background .15s,color .15s}
#rfm .seg span.on{background:var(--acc);color:var(--on,#fff)}
#rfm .est{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--warn);background:rgba(245,192,74,.08);border:1px solid rgba(245,192,74,.25);padding:8px 12px;border-radius:var(--r1);margin:-4px 0 14px}
#rfm .rank{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 20px}
#rfm .ri{display:flex;gap:14px;align-items:center;padding:8px;border-radius:var(--r1);cursor:pointer;transition:background .15s}
#rfm .ri:hover{background:var(--s2)}
#rfm .ri .n{width:30px;font-size:22px;font-weight:800;color:var(--tx3);text-align:center}
#rfm .ri:nth-child(-n+3) .n{color:var(--acc2)}
#rfm .ri .tn{width:120px;aspect-ratio:16/9;border-radius:var(--r1);object-fit:cover;flex:none;background:#222}
#rfm .ri .nm{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .ri .dl{font-size:12px;color:var(--tx2)}#rfm .ri .dl b{color:var(--ok)}
#rfm .browse{display:grid;grid-template-columns:250px 1fr;gap:28px}
#rfm .side{position:sticky;top:0;align-self:start}
#rfm .side h5{margin:18px 0 8px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--tx3)}
#rfm .side h5:first-child{margin-top:0}
#rfm .chips{display:flex;flex-wrap:wrap;gap:6px}
#rfm .chip{padding:6px 11px;border-radius:var(--r2);background:var(--s1);border:1px solid var(--line);font-size:12px;font-weight:600;color:var(--tx2);cursor:pointer;transition:all .15s}
#rfm .chip:hover{color:var(--tx);border-color:#444}
#rfm .chip.on{background:color-mix(in srgb,var(--acc) 15%,transparent);border-color:var(--acc);color:var(--acc2)}
#rfm .tog{display:flex;align-items:center;justify-content:space-between;padding:7px 0;color:var(--tx2);cursor:pointer;font-size:13px}
#rfm .tog i{width:34px;height:20px;border-radius:var(--r2);background:var(--s3);position:relative;transition:background .15s;flex:none}
#rfm .tog i:after{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#bbb;transition:transform .15s,background .15s}
#rfm .tog.on i{background:var(--acc)}#rfm .tog.on i:after{transform:translateX(14px);background:#fff}
#rfm .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
#rfm .side .rng{display:flex;gap:6px;align-items:center;color:var(--tx3);font-size:12px}
#rfm .side input.fi{width:100%;box-sizing:border-box;background:var(--s1);border:1px solid var(--line);color:var(--tx);border-radius:var(--r1);padding:7px 9px;font-size:13px;outline:none}
#rfm .side .rng input.fi{width:70px}
#rfm .side input.fi:focus{border-color:var(--acc)}
#rfm .ac{margin-top:4px;background:var(--s2);border:1px solid var(--line);border-radius:var(--r1);overflow:hidden}
#rfm .ac div{padding:6px 9px;font-size:12px;color:var(--tx2);cursor:pointer;display:flex;justify-content:space-between}#rfm .ac div:hover{background:var(--s3);color:var(--tx)}
#rfm .active{display:flex;flex-wrap:wrap;gap:6px;margin:-6px 0 14px;align-items:center}
#rfm .achip{padding:4px 6px 4px 10px;border-radius:var(--r2);background:color-mix(in srgb,var(--acc) 13%,transparent);border:1px solid color-mix(in srgb,var(--acc) 45%,transparent);color:var(--acc2);font-size:12px;font-weight:600;display:flex;gap:6px;align-items:center}
#rfm .achip b{cursor:pointer;opacity:.75;padding:0 4px}#rfm .achip b:hover{opacity:1}
#rfm .clrall{font-size:12px;color:var(--tx3);cursor:pointer;text-decoration:underline}
#rfm .tools{display:flex;align-items:center;gap:10px;position:relative}
#rfm .inst{font-size:12px;color:var(--tx2);cursor:pointer;padding:6px 10px;border-radius:var(--r2);border:1px solid var(--line);white-space:nowrap}#rfm .inst:hover{color:var(--tx);border-color:#555}
#rfm .inst b{color:var(--tx)}
#rfm .dlb{position:relative;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--tx2);background:var(--s1);border:1px solid var(--line)}
#rfm .dlb:hover{color:var(--tx)}#rfm .dlb svg.ring{position:absolute;inset:-1px;transform:rotate(-90deg)}
#rfm .dlb .bdg{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:var(--r2);background:var(--acc);color:var(--on,#fff);font-size:10px;font-weight:800;display:grid;place-items:center}
#rfm .dlp{position:absolute;top:44px;right:0;width:380px;max-height:60vh;overflow:auto;background:var(--s2);border:1px solid var(--line);border-radius:var(--r2);box-shadow:var(--pop);z-index:20;padding:8px}
#rfm .dlp h6{margin:6px 8px 8px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--tx3);display:flex;justify-content:space-between}
#rfm .dli{display:flex;gap:10px;padding:8px;border-radius:var(--r1);align-items:center}#rfm .dli:hover{background:var(--s3)}
#rfm .dli .tn{width:64px;height:36px;border-radius:var(--r1);object-fit:cover;background:#222;flex:none}
#rfm .dli .tx{flex:1;min-width:0}#rfm .dli .tt{font-size:13px;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .dli .ds{font-size:11px;color:var(--tx3);margin-top:3px;display:flex;gap:8px;flex-wrap:wrap}
#rfm .pbar{height:4px;border-radius:0;background:var(--s3);overflow:hidden;margin-top:5px}#rfm .pbar i{display:block;height:100%;background:var(--acc);transition:width .4s linear}
#rfm .dli.done .pbar i{background:var(--ok)}#rfm .dli.failed .ds{color:#ff6b6b}
#rfm .cimg .cpb{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(0,0,0,.5)}#rfm .cimg .cpb i{display:block;height:100%;background:var(--acc);transition:width .4s linear}
#rfm .btn.inst-ok{background:rgba(62,207,110,.15);color:var(--ok);border-color:rgba(62,207,110,.4)}
#rfm .lib .ltabs{display:flex;gap:6px;align-items:center;margin-bottom:14px}
#rfm .ltools{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
#rfm .ltools .lq{max-width:520px}#rfm .lbl{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--tx3);align-self:center;margin:0 4px 0 8px}
#rfm input.fi,#rfm textarea.fi{box-sizing:border-box;background:var(--s1);border:1px solid var(--line);color:var(--tx);border-radius:var(--r1);padding:8px 10px;font-size:13px;outline:none;font-family:inherit}
#rfm textarea.ta{width:100%;min-height:90px;margin:6px 0;resize:vertical}
#rfm .lgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
#rfm .lcard{background:var(--s1);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;content-visibility:auto;contain-intrinsic-size:230px 260px}
#rfm .lcard.off{opacity:.62}#rfm .lcard.sel{border-color:var(--acc)}
#rfm .lth{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,#23262c,#17181c)}#rfm .lth img{width:100%;height:100%;object-fit:cover;display:block}
#rfm .lsel,#rfm .lfav{position:absolute;top:6px;cursor:pointer;font-size:17px;color:var(--on,#fff);text-shadow:0 1px 3px #000;padding:2px 5px;border-radius:var(--r1);background:rgba(0,0,0,.35)}
#rfm .lsel{left:6px}#rfm .lth .lfav{right:6px}#rfm .lfav.on{color:var(--warn)}
#rfm .liss{position:absolute;bottom:6px;left:6px;font-size:12px;padding:2px 6px;border-radius:var(--r1);background:rgba(255,93,82,.85);color:var(--on,#fff);margin-left:0}
#rfm .liss.dup{left:6px}#rfm .liss.conf{left:34px}#rfm .liss.req{left:62px;background:rgba(245,192,74,.9);color:#000}
#rfm .lbody{padding:10px 12px}#rfm .ltags{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}
#rfm .ltag{font-size:11px;padding:3px 7px;border-radius:var(--r2);background:var(--s3);color:var(--tx2);cursor:pointer}#rfm .ltag b{margin-left:4px;opacity:.6}
#rfm .ltag.add{background:none;border:1px dashed var(--line)}#rfm .ltin{width:110px;padding:3px 7px!important;font-size:11px!important}
#rfm .bulk{display:flex;gap:8px;align-items:center;padding:10px 12px;background:color-mix(in srgb,var(--acc) 10%,transparent);border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);border-radius:var(--r1);margin-bottom:12px}
#rfm .lform{background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:14px;margin:0 0 16px;display:flex;flex-direction:column;gap:8px;max-width:760px}
#rfm .lform h3,#rfm .lh{margin:4px 0;font-size:16px}#rfm .lh{margin:22px 0 8px}#rfm .lh span{color:var(--tx3);font-weight:400;margin-left:6px}
#rfm .logrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:16px}
#rfm .locard{background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);overflow:hidden}
#rfm .locov{position:relative;height:120px;background:linear-gradient(135deg,#2a1a0c,#17181c)}#rfm .locov img{width:100%;height:100%;object-fit:cover}
#rfm .lobtns{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#rfm .lobtns .btn{height:32px;padding:0 12px;font-size:12px}
#rfm .btn.bad{background:var(--bad);color:var(--on,#fff)}
#rfm .hrow{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;padding:10px 12px;background:var(--s1);border:1px solid var(--line);border-radius:var(--r1);margin-bottom:8px}
#rfm .hrow .hb{display:flex;gap:6px;flex:none}#rfm .hm{font-size:13px;color:var(--tx2);margin-top:3px}
#rfm .lmsg{padding:9px 12px;border-radius:var(--r1);margin-bottom:12px;background:rgba(62,207,110,.12);border:1px solid rgba(62,207,110,.35);display:flex;justify-content:space-between}
#rfm .lmsg.error{background:rgba(255,93,82,.12);border-color:rgba(255,93,82,.4)}#rfm .lmsg b{cursor:pointer}
#rfm .dcards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}#rfm .dcards div{background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:14px}
#rfm .dcards b{display:block;font-size:22px}#rfm .dcards span{color:var(--tx3);font-size:12px}
#rfm .dbar{display:grid;grid-template-columns:200px 1fr 90px;gap:10px;align-items:center;font-size:13px;margin:6px 0}#rfm .dbar .pbar{margin:0;height:8px}
#rfm .pkbox{width:min(720px,92vw);max-height:84vh;display:flex;flex-direction:column;gap:10px;overflow:hidden}
#rfm .pkbox .pkl{overflow-y:auto;overflow-x:hidden;border:1px solid var(--line);border-radius:var(--r1);max-height:46vh}
#rfm .pkrow{display:grid;grid-template-columns:minmax(0,1fr) 90px 110px;gap:10px;padding:9px 12px;border-bottom:1px solid var(--line);font-size:13px;align-items:center}
#rfm .pkrow:last-child{border-bottom:0}#rfm .pkrow b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
#rfm .pkst{font-size:11px;font-weight:800;padding:3px 8px;border-radius:var(--r2);text-align:center}
#rfm .pkst.installed{background:rgba(62,207,110,.15);color:var(--ok)}#rfm .pkst.missing{background:color-mix(in srgb,var(--acc) 18%,transparent);color:var(--acc2)}#rfm .pkst.unavailable{background:rgba(255,93,82,.15);color:var(--bad)}
#rfm .pkdesc{color:var(--tx2);white-space:pre-wrap;overflow-wrap:anywhere}
#rfm .pktot{display:flex;gap:16px;font-size:13px;color:var(--tx2)}#rfm .pktot b{color:var(--tx)}
#rfm .ldesc{font-size:12px;color:var(--tx2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;margin:2px 0 4px}
#rfm .cnt2{font-size:11px;color:var(--tx3);text-align:right}#rfm .cnt2.over{color:var(--bad)}
#rfm .pkfile{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:var(--r1);margin-top:6px}
#rfm .pkfile .nm{min-width:0;flex:1}#rfm .pkfile .nm b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rfm .pkfile .nm span{font-size:11px;color:var(--tx3);overflow-wrap:anywhere}
#rfm .rhead .pkhead{margin-left:auto;font-size:14px;padding:10px 18px;box-shadow:none}
#rfm .pkwhere{font-size:10px;font-weight:800;text-transform:uppercase;padding:2px 6px;border-radius:var(--r1);background:var(--line);color:var(--tx2);margin-right:6px}
#rfm .pkbig{font-size:15px;padding:12px 22px}
#rfm .catp{cursor:pointer}#rfm .catp:hover{color:var(--tx)}
#rfm .catpanel{position:absolute;top:52px;right:240px;z-index:40;width:380px;background:var(--bg2,#17181b);border:1px solid var(--line);border-radius:var(--r2);padding:12px 14px;box-shadow:var(--pop);font-size:12px}
#rfm .catpanel h4{margin:0 0 8px;font-size:13px}#rfm .catpanel .cr{display:grid;grid-template-columns:120px 1fr 92px;gap:8px;align-items:center;padding:3px 0}
#rfm .catpanel .bar{height:6px;border-radius:var(--r1);background:var(--line);overflow:hidden}#rfm .catpanel .bar i{display:block;height:100%;background:var(--acc)}
#rfm .catpanel .cr.ok .bar i{background:var(--ok)}#rfm .catpanel .cr.cur b{color:var(--acc2)}#rfm .catpanel .num{text-align:right;color:var(--tx2);font-variant-numeric:tabular-nums}
#rfm .catpanel .nt{color:var(--tx3);margin-top:8px;line-height:1.4}
#rfm .gtile .ov .gup{display:block;margin-top:2px;opacity:.8}
#rfm.perf *,#rfm.perf *::before,#rfm.perf *::after{transition:none!important;animation:none!important;box-shadow:none;text-shadow:none!important}
#rfm.perf .hbg{display:none!important}#rfm.perf *{filter:none!important;backdrop-filter:none!important;will-change:auto!important}#rfm.perf .hmain{background:var(--s1)}#rfm.perf img.im{opacity:1}#rfm.perf .card:hover,#rfm.perf .cdet:hover,#rfm.perf .gtile:hover,#rfm.perf .crow:hover{transform:none}
#rfm.perf .himg{-webkit-mask-image:none;mask-image:none}#rfm.perf .hli.on .bar{transform:scaleX(1)}
#rfm .accs{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0}
#rfm .acsw{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;width:68px;font-size:11px;color:var(--tx2)}
#rfm .acsw i{width:40px;height:40px;border-radius:50%;background:var(--sw);border:3px solid transparent;box-shadow:none}
#rfm .acsw.on i{border-color:var(--tx);box-shadow:none}#rfm .acsw.on b{color:var(--tx)}#rfm .acsw b{font-weight:600}
#rfm .acsw.cust i{background:conic-gradient(var(--acc),#e0a800,#1fae5b,#14b8c4,#2f7bff,#8a4dff,#e83e8c,var(--acc))}#rfm .acsw.cust.on i{background:var(--sw)}
#rfm .acsw.cust input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}#rfm .acsw.cust{position:relative}
#rfm .welbox{width:min(640px,92vw)}#rfm .welprev{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:14px;border:1px solid var(--line);border-radius:var(--r2);background:var(--s1)}
#rfm .welprev .pbar{width:120px;height:3px;background:var(--s3);border-radius:0;overflow:hidden}#rfm .welprev .pbar i{display:block;width:60%;height:100%;background:var(--acc)}
#rfm .welprev .tabx{padding:6px 12px;border-radius:var(--r1);background:var(--s3);font-weight:600;box-shadow:inset 0 -2px 0 var(--acc)}
#rfm{accent-color:var(--acc)}#rfm .gear{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--tx2);font-size:18px;background:var(--s2);border:1px solid var(--line);margin-left:8px}#rfm .gear:hover{color:var(--tx);border-color:var(--acc)}
#rfm .modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:30}#rfm .mpjbar{height:6px;border-radius:0;background:var(--line);overflow:hidden;margin:8px 0}#rfm .mpjbar i{display:block;height:100%;background:var(--acc)}#rfm .mpjmods{max-height:220px;overflow:auto}
#rfm .jpill{position:fixed;right:18px;bottom:18px;width:440px;max-width:calc(100vw - 36px);z-index:28;background:var(--s2);border:1px solid var(--line);border-radius:var(--r2);box-shadow:var(--pop);padding:10px 12px}
#rfm .jpill[hidden]{display:none}#rfm .jpill .jpt{display:flex;flex-direction:column;gap:2px;min-width:0}
#rfm .jpill .jpt b,#rfm .jpill .jpt span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rfm .jpill .jpt b{font-size:13px}#rfm .jpill .jpt span{font-size:12px;color:var(--tx2)}
#rfm .jpill .mpjbar{margin:7px 0 8px}#rfm .jpill .jpb{display:flex;gap:6px;align-items:center}#rfm .jpill .jpb .btn{padding:5px 10px;font-size:12px}
#rfm .jpill .jpk{margin-right:auto;font-size:12px;color:var(--tx2);cursor:pointer;border:1px solid var(--line);border-radius:var(--r2);padding:4px 10px}#rfm .jpill .jpk.on{color:var(--on,#fff);background:var(--acc);border-color:var(--acc)}
#rfm .pkdl{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--tx2);margin:4px 0}#rfm .pkdl .bad{color:var(--bad)}#rfm .pkdl .btn{padding:3px 9px;font-size:12px}
#rfm .spjob{font-size:12px;color:var(--tx2);margin:8px 0}
#rfm .mbox{background:var(--s2);border:1px solid var(--line);border-radius:var(--r2);padding:20px;max-width:520px;width:90%}
#rfm .mpwrap{overflow:auto}#rfm table.mpt{width:100%;border-collapse:collapse;font-size:13px}
#rfm .mpt th{text-align:left;color:var(--tx3);font-weight:600;padding:8px;cursor:pointer;position:sticky;top:0;background:var(--bg);white-space:nowrap}
#rfm .mpt td{padding:7px 8px;border-top:1px solid var(--line);white-space:nowrap}#rfm .mpt td.sn{white-space:normal;max-width:520px}
#rfm .mpt tr{cursor:pointer}#rfm .mpt tbody tr:hover,#rfm .mpt tr.on{background:var(--s1)}#rfm .mpt .lfav{position:static;background:none;text-shadow:none;color:var(--tx3)}#rfm .mpt .lfav.on{color:var(--warn)}
#rfm .badge-s{font-size:10px;font-weight:800;color:var(--acc2);border:1px solid var(--acc);border-radius:var(--r1);padding:1px 4px;margin-right:6px}
#rfm .mpdet{position:fixed;right:0;top:64px;bottom:0;width:440px;background:var(--s2);border-left:1px solid var(--line);padding:18px;overflow:auto;z-index:10;box-shadow:var(--pop)}
#rfm .mpdet .close{position:absolute;right:14px;top:12px;cursor:pointer}#rfm .mpdet h4{margin:16px 0 6px}
#rfm .rhead{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:var(--tx2)}
#rfm .rhead h2{margin:0;color:var(--tx);font-size:22px}
#rfm .browse{grid-template-columns:288px minmax(0,1fr)}
#rfm .browse>section{min-width:0}
#rfm .side.fx{position:sticky;top:0;max-height:calc(100vh - 64px - 40px);overflow-y:auto;overflow-x:hidden;background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:0 0 10px;scrollbar-width:thin}
#rfm .fxh{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--s1);border-bottom:1px solid var(--line)}
#rfm .fxh h4{margin:0;font-size:15px;font-weight:800;color:var(--tx);display:flex;align-items:center;gap:8px}
#rfm .fxh .cnt{min-width:20px;height:20px;padding:0 6px;border-radius:var(--r2);background:var(--acc);color:var(--on,#fff);font-size:11px;font-weight:800;display:inline-grid;place-items:center}
#rfm .fxh .clr{margin-left:auto;font-size:12px;color:var(--tx3);cursor:pointer;padding:4px 8px;border-radius:var(--r1);transition:color .15s,background .15s}#rfm .fxh .clr:hover{color:var(--tx);background:var(--s3)}
#rfm .fs{border-bottom:1px solid var(--line)}#rfm .fs:last-child{border-bottom:0}
#rfm .fsh{display:flex;align-items:center;gap:8px;padding:12px 16px;cursor:pointer;user-select:none;font-size:12px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase;color:var(--tx2);transition:color .15s,background .15s}
#rfm .fsh:hover{color:var(--tx);background:var(--s2)}
#rfm .fsh .badge2{font-size:10px;letter-spacing:0;text-transform:none;font-weight:800;color:var(--acc2);background:color-mix(in srgb,var(--acc) 16%,transparent);padding:1px 7px;border-radius:var(--r2)}
#rfm .fsh .chev{margin-left:auto;width:16px;height:16px;transition:transform .22s ease;opacity:.6}
#rfm .fs.closed .chev{transform:rotate(-90deg)}
#rfm .fsb{padding:2px 16px 14px;display:flex;flex-direction:column;gap:6px}
#rfm .fs.closed .fsb{display:none}
#rfm .ck{display:flex;align-items:center;gap:10px;padding:6px 8px;margin:0 -8px;border-radius:var(--r1);cursor:pointer;color:var(--tx2);font-size:13px;transition:background .15s,color .15s}
#rfm .ck:hover{background:var(--s2);color:var(--tx)}
#rfm .ck i{width:18px;height:18px;border-radius:var(--r1);border:2px solid var(--tx3);display:grid;place-items:center;flex:none;transition:all .15s}
#rfm .ck.rad i{border-radius:50%}
#rfm .ck.on{color:var(--tx)}#rfm .ck.on i{background:var(--acc);border-color:var(--acc)}
#rfm .ck.on i:after{content:"";width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:translateY(-1px) rotate(45deg)}
#rfm .ck.rad.on i:after{width:6px;height:6px;border:0;border-radius:50%;background:#fff;transform:none}
#rfm .ck .n{margin-left:auto;font-size:11px;color:var(--tx3);font-variant-numeric:tabular-nums}
#rfm .fsb .tog{padding:6px 0;font-size:13px}#rfm .fsb .tog:hover{color:var(--tx)}
#rfm .rs{display:flex;flex-direction:column;gap:6px}
#rfm .rs .rl{display:flex;justify-content:space-between;font-size:12px;color:var(--tx3)}#rfm .rs .rl b{color:var(--acc2);font-weight:800;font-variant-numeric:tabular-nums}
#rfm input[type=range].rg{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:var(--r2);background:linear-gradient(90deg,var(--acc) 0,var(--acc) var(--p,0%),var(--s3) var(--p,0%));outline:none;margin:6px 0;cursor:pointer}
#rfm input[type=range].rg::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--acc);box-shadow:none;transition:transform .12s}
#rfm input[type=range].rg:hover::-webkit-slider-thumb,#rfm input[type=range].rg:focus::-webkit-slider-thumb{transform:none}
#rfm input[type=range].rg:focus-visible{box-shadow:none}
#rfm .stars{display:flex;gap:4px;align-items:center}
#rfm .stars span{font-size:22px;line-height:1;cursor:pointer;color:var(--s3);transition:color .12s,transform .12s}
#rfm .stars span.on{color:#ffc24a}#rfm .stars span:hover{transform:none}
#rfm .stars:hover span{color:#ffc24a}#rfm .stars span:hover~span{color:var(--s3)}
#rfm .stars em{margin-left:auto;font-style:normal;font-size:12px;color:var(--tx3);cursor:pointer}#rfm .stars em:hover{color:var(--tx)}
#rfm .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#rfm .cchip{display:flex;align-items:center;gap:7px;padding:7px 9px;border-radius:var(--r1);background:var(--s2);border:1px solid var(--line);font-size:12px;font-weight:600;color:var(--tx2);cursor:pointer;min-width:0;transition:border-color .15s,background .15s,color .15s,transform .15s}
#rfm .cchip:hover{color:var(--tx);border-color:var(--tx3);transform:none}
#rfm .cchip.on{background:color-mix(in srgb,var(--acc) 16%,transparent);border-color:var(--acc);color:var(--tx)}
#rfm .cchip .e{font-size:15px;flex:none}#rfm .cchip .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#rfm .cchip .n{margin-left:auto;font-size:10.5px;color:var(--tx3);font-variant-numeric:tabular-nums}
#rfm .sortl{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#rfm .sortl span{padding:7px 9px;border-radius:var(--r1);background:var(--s2);border:1px solid var(--line);font-size:12px;font-weight:600;color:var(--tx2);cursor:pointer;text-align:center;transition:all .15s}
#rfm .sortl span:hover{color:var(--tx);border-color:var(--tx3)}#rfm .sortl span.on{background:var(--acc);border-color:var(--acc);color:var(--on,#fff)}
#rfm .side.fx input.fi{background:var(--s2)}
#rfm .side.fx input.fi:focus{box-shadow:none}
#rfm .active{margin:0 0 14px;padding:10px 12px;background:var(--s1);border:1px solid var(--line);border-radius:var(--r2)}
#rfm .achip{background:color-mix(in srgb,var(--acc) 14%,transparent);border-color:color-mix(in srgb,var(--acc) 50%,transparent);animation:rfpop .18s ease}
#rfm .clrall{margin-left:auto;font-weight:700;text-decoration:none;padding:4px 10px;border-radius:var(--r2);border:1px solid var(--line)}#rfm .clrall:hover{color:var(--tx);border-color:var(--acc)}
@keyframes rfpop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
#rfm .vsw{display:inline-flex;gap:2px;padding:3px;border-radius:var(--r1);background:var(--s1);border:1px solid var(--line);margin-left:12px;flex:none}
#rfm .vsw span{width:34px;height:30px;display:grid;place-items:center;border-radius:var(--r1);cursor:pointer;color:var(--tx3);transition:background .15s,color .15s}
#rfm .vsw span:hover{color:var(--tx);background:var(--s2)}#rfm .vsw span.on{background:var(--acc);color:var(--on,#fff)}
#rfm .vsw svg{width:16px;height:16px}
#rfm .rv{animation:rfview .24s ease}
@keyframes rfview{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
#rfm .rv>*{contain:layout paint style}
#rfm .cl{display:flex;flex-direction:column;gap:4px}
#rfm .crow{display:grid;grid-template-columns:72px minmax(0,1fr) 92px 70px 72px 86px 120px;gap:14px;align-items:center;padding:6px 10px 6px 6px;border-radius:var(--r1);background:var(--s1);cursor:pointer;position:relative;transition:background .15s}
#rfm .crow:hover{background:var(--s2);outline:1px solid color-mix(in srgb,var(--acc) 45%,transparent);outline-offset:-1px}
#rfm .crow .th{width:72px;height:40px;border-radius:var(--r1);overflow:hidden;background:var(--s3);position:relative}
#rfm .crow .th img{width:100%;height:100%;object-fit:cover;display:block}
#rfm .crow .tt{min-width:0;display:flex;flex-direction:column}
#rfm .crow .tt b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .crow .tt span{font-size:12px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .crow .v{font-size:12px;color:var(--tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
#rfm .bdg{display:inline-block;font-size:10.5px;font-weight:800;padding:3px 7px;border-radius:var(--r1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#rfm .crow .btn,#rfm .cdet .btn{height:30px;padding:0 10px;font-size:12px;width:100%}
#rfm .rowpb{position:absolute;left:6px;right:6px;bottom:2px;height:3px;border-radius:0;background:rgba(0,0,0,.4);overflow:hidden}#rfm .rowpb i{display:block;height:100%;background:var(--acc);transition:width .4s linear}
#rfm .dl2{display:flex;flex-direction:column;gap:12px}
#rfm .cdet{display:grid;grid-template-columns:280px minmax(0,1fr) 170px;gap:18px;padding:12px;border-radius:var(--r2);background:var(--s1);cursor:pointer;transition:background .15s}
#rfm .cdet:hover{background:var(--s2);outline:1px solid color-mix(in srgb,var(--acc) 55%,transparent);outline-offset:-1px}
#rfm .cdet .th{aspect-ratio:16/9;border-radius:var(--r1);overflow:hidden;background:var(--s3);position:relative}
#rfm .cdet .th img{width:100%;height:100%;object-fit:cover;display:block}
#rfm .cdet .bd{min-width:0;display:flex;flex-direction:column;gap:6px}
#rfm .cdet .bd h3{margin:0;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rfm .cdet .ex{color:var(--tx2);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
#rfm .cdet .tg{display:flex;gap:6px;flex-wrap:wrap}#rfm .cdet .tg span{font-size:11px;padding:2px 8px;border-radius:var(--r2);background:var(--s3);color:var(--tx2)}
#rfm .cdet .sx{display:flex;flex-direction:column;gap:6px;justify-content:center;font-size:12px;color:var(--tx2)}
#rfm .gal2{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px}
#rfm .gtile{position:relative;aspect-ratio:16/9;border-radius:var(--r2);overflow:hidden;cursor:pointer;background:var(--s2);}
#rfm .gtile img{width:100%;height:100%;object-fit:cover;display:block}
#rfm .gtile:hover{outline:2px solid var(--acc);outline-offset:-2px}
#rfm .gtile .ov{position:absolute;inset:auto 0 0 0;padding:40px 16px 14px;background:linear-gradient(0deg,rgba(0,0,0,.85),transparent);color:var(--on,#fff);opacity:0;transition:opacity .15s}
#rfm .gtile:hover .ov{opacity:1}
#rfm .gtile .ov b{display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rfm .gtile .ov span{font-size:12px;opacity:.85}
#rfm .gtile .qsub{bottom:auto;top:10px}
#rfm .crow:hover .qsub,#rfm .cdet:hover .qsub,#rfm .gtile:hover .qsub{opacity:1;transform:none}
#rfm .crow .qsub,#rfm .cdet .qsub{position:static;opacity:1;transform:none}
#rfm .skr{height:52px;border-radius:var(--r1)}#rfm .skd{height:182px;border-radius:var(--r2)}#rfm .skg{aspect-ratio:16/9;border-radius:var(--r2)}
#rfm .kbd{font-size:11px;color:var(--tx3);margin-left:8px}
@media (prefers-reduced-motion:reduce){#rfm .rv,#rfm .achip{animation:none}}
#rfm .catp{font-size:12px;color:var(--tx3);white-space:nowrap}#rfm .nav>.catp{flex:0 1 auto;min-width:0;max-width:200px;overflow:hidden;text-overflow:ellipsis}#rfm .catp b{color:var(--tx2);font-weight:600}
#rfm .more{text-align:center;margin:26px;color:var(--tx3);font-size:13px}
#rfm .mpred{background:#d61f1f;color:var(--on,#fff);border:3px solid #ff6b6b;border-radius:var(--r2);padding:22px 26px;margin:6px 0 18px;display:flex;gap:20px;align-items:center;box-shadow:none}
#rfm .mpred .ico{font-size:54px;line-height:1;flex:none}#rfm .mpred h3{margin:0 0 6px;font-size:26px;font-weight:900;color:var(--on,#fff)}#rfm .mpred p{margin:0;font-size:17px;font-weight:600;color:var(--on,#fff)}#rfm .mpred .why{margin-top:8px;font-size:14px;opacity:.9}#rfm .mpred .btn{margin-top:14px;background:#fff;color:#b00000;font-weight:800;font-size:16px;border:0}
#rfm .empty{padding:60px 20px;text-align:center;color:var(--tx3)}
#rfm .empty b{display:block;font-size:18px;color:var(--tx2);margin-bottom:6px}
#rfm .sk{background:var(--s2);animation:rfmPulse 1s ease-in-out infinite;border-radius:var(--r1)}
@keyframes rfmSk{from{background-position:100% 0}to{background-position:-100% 0}}
#rfm .vg{background:var(--s1);border-radius:var(--r);contain:layout paint style;min-width:0;overflow:hidden}#rfm .vg-g{aspect-ratio:16/9;height:auto!important;border-radius:var(--r2)}
#rfm .skc{background:var(--s1);border-radius:var(--r);overflow:hidden}
#rfm .skc .sk.i{aspect-ratio:16/9;border-radius:0}
#rfm .skc .l{height:12px;margin:12px 14px 0}#rfm .skc .l.s{width:55%;margin-bottom:14px}
#rfm .dhero{position:relative;height:300px;overflow:hidden;margin:-24px -32px 0}
#rfm .dhero .hbg{filter:none;opacity:.45;inset:-30px}
#rfm .dhero .hshade{background:linear-gradient(0deg,var(--bg) 0,rgba(15,16,18,.3) 60%,rgba(15,16,18,.5))}
#rfm .dhead{position:absolute;left:32px;right:32px;bottom:26px;display:flex;flex-direction:column;gap:10px}
#rfm .back{position:absolute;left:32px;top:20px}
#rfm .dtitle{font-size:38px;font-weight:800;letter-spacing:-.5px;line-height:1.1}
#rfm .dgrid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:30px;margin-top:8px}
#rfm .wrap[data-view="detail"]{width:1280px;max-width:100%;overflow-x:hidden}
#rfm .dgrid>*{min-width:0;max-width:100%}
#rfm .gal{min-width:0;overflow:hidden}
#rfm .gal .main{display:block;width:100%;height:auto;max-width:100%}
#rfm .gal .main{width:100%;aspect-ratio:16/9;border-radius:var(--r2);object-fit:contain;background:#000}
#rfm .gal .strip{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;overflow:hidden;padding-bottom:6px}
#rfm .gal .strip img{width:120px;height:68px;aspect-ratio:16/9;object-fit:cover;border-radius:var(--r1);cursor:pointer;opacity:.55;transition:opacity .15s;border:2px solid transparent;flex:none}
#rfm .gal .strip img.on,#rfm .gal .strip img:hover{opacity:1}#rfm .gal .strip img.on{border-color:var(--acc)}
#rfm .panel{background:var(--s1);border-radius:var(--r2);padding:20px;display:flex;flex-direction:column;gap:14px;position:sticky;top:0;align-self:start}
#rfm .kv{display:flex;justify-content:space-between;font-size:13px;color:var(--tx2);border-bottom:1px solid var(--line);padding-bottom:10px}
#rfm .kv b{color:var(--tx);font-weight:600}
#rfm .upbig{font-size:13px;color:var(--tx2)}#rfm .upbig b{display:block;font-size:22px;color:#8ec8ff;margin-top:2px}
#rfm .descb{max-width:100%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word;margin-top:24px;background:var(--s1);border-radius:var(--r2);padding:22px 24px;white-space:pre-wrap;color:#d4d7dd;line-height:1.6;font-size:14px}
#rfm .descb img,#rfm .descb video,#rfm .descb iframe,#rfm .descb table{max-width:100%;height:auto}#rfm .descb table{display:block;overflow:hidden;table-layout:fixed}#rfm .descb pre,#rfm .descb code{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}#rfm .dhead,#rfm .dtitle{overflow-wrap:anywhere;max-width:100%}
#rfm .descb h4{margin:0 0 10px;font-size:16px;color:var(--tx)}
#rfm .foot{color:var(--tx3);font-size:12px;text-align:center;margin-top:30px}
@media (max-width:1300px){#rfm .rail{grid-auto-columns:calc((100% - 3*16px)/4)}#rfm .rank{grid-template-columns:repeat(2,1fr)}}
@media (max-width:1000px){#rfm .hero{grid-template-columns:1fr}#rfm .hlist{display:none}#rfm .rail{grid-auto-columns:calc((100% - 2*16px)/3)}#rfm .dgrid{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){#rfm *{animation:none!important;transition:none!important}}
#rfm .liss{position:static!important;display:inline-block;margin-right:3px}
#rfm .liss.upd{background:rgba(62,207,110,.9);color:#04210f}#rfm .liss.sup{background:rgba(255,105,180,.85)}
#rfm .lbdg{position:absolute;bottom:6px;left:6px;display:flex;gap:3px}
#rfm .mm{display:grid;grid-template-columns:210px minmax(0,1fr);gap:18px;align-items:start}#rfm .mm.mini{grid-template-columns:52px minmax(0,1fr)}
#rfm .mm.hasdrw{grid-template-columns:210px minmax(0,1fr) 380px}#rfm .mm.mini.hasdrw{grid-template-columns:52px minmax(0,1fr) 380px}
#rfm .sb{position:sticky;top:0;background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:8px;max-height:calc(100vh - 150px);overflow:auto}
#rfm .sb h6{margin:12px 8px 4px;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:var(--tx3)}
#rfm .sbt{cursor:pointer;color:var(--tx3);text-align:right;padding:2px 6px;font-size:14px}#rfm .sb.mini .sbt{text-align:center}
#rfm .sbi{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:var(--r1);cursor:pointer;color:var(--tx2);font-size:13px;position:relative;white-space:nowrap}
#rfm .sbi:hover{background:var(--s2)}#rfm .sbi.on{background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--on,#fff);box-shadow:inset 3px 0 0 var(--acc)}
#rfm .sbi i{font-style:normal;width:20px;text-align:center;flex:none}#rfm .sbi span{flex:1;overflow:hidden;text-overflow:ellipsis}
#rfm .sbi b{font-weight:600;font-size:11px;color:var(--tx3);background:var(--s3);border-radius:var(--r2);padding:1px 7px}#rfm .sbi b.hot{background:var(--acc);color:var(--on,#fff)}
#rfm .sbi em{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:var(--acc)}
#rfm .ltb{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}#rfm .ltb .lq{flex:1;min-width:220px}
#rfm select.fi{width:auto;background:var(--s2);color:var(--tx);border:1px solid var(--line);border-radius:var(--r1);padding:7px 10px}#rfm .lsort{width:auto}#rfm .seg{display:inline-flex;border:1px solid var(--line);border-radius:var(--r1);overflow:hidden}
#rfm .seg b{padding:6px 10px;cursor:pointer;color:var(--tx3);font-weight:400}#rfm .seg b.on{background:var(--acc);color:var(--on,#fff)}
#rfm .lfp{display:grid;grid-template-columns:1fr 1fr;gap:18px;background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:12px 14px;margin-bottom:10px}
#rfm .lfp h5{margin:4px 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--tx3)}
#rfm .cb{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--tx2);padding:3px 0;cursor:pointer}#rfm .cb span{margin-left:auto;color:var(--tx3);font-size:11px}
#rfm .cb i{width:14px;height:14px;border-radius:var(--r1);border:1px solid var(--tx3)}#rfm .cb.on i{background:var(--acc);border-color:var(--acc)}
#rfm .ltag.on{background:var(--acc);color:var(--on,#fff)}#rfm .ltag.sug{background:none;border:1px dashed color-mix(in srgb,var(--acc) 50%,transparent);color:var(--acc2)}
#rfm .vrow{display:flex;gap:4px;margin:4px 0 2px;min-height:18px}#rfm .vchip{font-size:10.5px;padding:1px 7px;border-radius:var(--r2);background:var(--s3);color:var(--tx2)}
#rfm .vchip.st{background:color-mix(in srgb,var(--acc) 18%,transparent);color:var(--acc2);cursor:pointer}
#rfm .llist{display:flex;flex-direction:column;gap:4px}
#rfm .lrow{display:grid;grid-template-columns:26px 64px minmax(0,1fr) 110px 70px 90px 26px 46px;gap:10px;align-items:center;padding:6px 10px;background:var(--s1);border:1px solid var(--line);border-radius:var(--r1);font-size:13px}
#rfm .lrow.off{opacity:.62}#rfm .lrow.sel{border-color:var(--acc)}#rfm .lrow .lsel,#rfm .lrow .lfav{position:static;background:none;text-shadow:none;color:var(--tx3)}#rfm .lrow .lfav.on{color:var(--warn)}
#rfm .lrth{width:64px;height:36px;border-radius:var(--r1);overflow:hidden;background:var(--s3)}#rfm .lrth img{width:100%;height:100%;object-fit:cover}
#rfm .lrt{cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}#rfm .lrt .ca{margin-left:6px}#rfm .lrc{color:var(--tx3);font-size:12px}
#rfm .lrow .tog{padding:0}#rfm .ct[data-a]{cursor:pointer}
#rfm .drw{position:sticky;top:0;background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:12px 14px;max-height:calc(100vh - 150px);overflow:auto}
#rfm .drw .close{position:absolute;right:10px;top:8px;z-index:2;cursor:pointer;background:rgba(0,0,0,.5);border-radius:50%;width:26px;height:26px;display:grid;place-items:center}
#rfm .drw h3{margin:10px 0 2px}#rfm .drw h4{margin:16px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--tx3)}
#rfm .car{position:relative;aspect-ratio:16/9;border-radius:var(--r1);overflow:hidden;background:#111}#rfm .car img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#111}#rfm .car .noimg.ph{position:absolute;inset:0;height:auto;font-size:13px}#rfm img.im.bad{display:none}
#rfm .car .noimg{display:grid;place-items:center;height:100%;color:var(--tx3)}
#rfm .cprev,#rfm .cnext{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.55);display:grid;place-items:center;cursor:pointer;font-size:20px}
#rfm .cprev{left:8px}#rfm .cnext{right:8px}#rfm .ccount{position:absolute;bottom:8px;right:8px;font-size:11px;background:rgba(0,0,0,.6);padding:2px 8px;border-radius:var(--r2)}
#rfm .stars{margin:6px 0;display:flex;align-items:center;gap:2px}#rfm .stars b{cursor:pointer;color:var(--s3);font-size:18px}#rfm .stars b.on{color:var(--warn)}#rfm .stars .phnote{margin-left:8px}
#rfm .btn.sup{background:rgba(255,105,180,.15);color:#ff8cc6;border:1px solid rgba(255,105,180,.35)}
#rfm .hm.dis{opacity:.5;text-decoration:line-through}#rfm .hm .clrall{margin-left:8px}
#rfm .frow{display:flex;gap:10px;align-items:center}#rfm .frow .fi{flex:1;min-width:0}#rfm .frow .btn{flex:none}
#rfm .locard{cursor:grab}#rfm .locard.drag{opacity:.4}#rfm .locov{position:relative}
#rfm .loemo{position:absolute;left:10px;bottom:8px;font-size:30px;text-shadow:0 2px 6px #000}#rfm .pfx.pin{left:auto;right:8px;background:#2f7bff}
#rfm details.hrow{display:block}#rfm details.hrow summary{cursor:pointer;display:flex;gap:10px;align-items:center}#rfm details.hrow summary .btn{margin-left:auto}
#rfm .cmp{position:relative;background:var(--s1);border:1px solid var(--acc);border-radius:var(--r2);padding:14px;margin-bottom:14px}#rfm .cmp .close{position:absolute;right:12px;top:10px;cursor:pointer}
#rfm .cmpg{display:grid;gap:6px 12px;margin:10px 0;font-size:13px;align-items:center}#rfm .cmpg b.keep{color:var(--ok)}
#rfm .dcards .save b{color:var(--ok)}#rfm .chip .sw{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
#rfm .bell{margin-right:6px}#rfm .bellp{right:46px}
#rfm .nti{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;padding:8px;border-bottom:1px solid var(--line);color:var(--tx2)}#rfm .nti em{color:var(--tx3);font-style:normal;flex:none}
#rfm .nti.error span{color:var(--bad)}
#rfm .dbg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:8px}
#rfm .dbc{background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:14px;display:flex;flex-direction:column;gap:2px;position:relative}
#rfm .dbc.lnk{cursor:pointer}#rfm .dbc.lnk:hover{border-color:var(--acc)}#rfm .dbc i{font-style:normal;position:absolute;right:12px;top:10px;color:var(--acc);font-size:18px}
#rfm .dbc b{font-size:26px}#rfm .dbc span{color:var(--tx2);font-size:13px}#rfm .dbc em{color:var(--tx3);font-size:11.5px;font-style:normal}
#rfm .thg{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}#rfm .thc{border:2px solid;border-radius:var(--r1);padding:10px;cursor:pointer;font-size:12.5px}
#rfm .thc span{display:block;opacity:.6;font-size:11px}#rfm .thp{display:flex;gap:4px;margin-bottom:6px}#rfm .thp i{flex:1;height:18px;border-radius:var(--r1)}
#rfm.light .lth,#rfm.light .locov{background:#d9dce1}#rfm.light .sbi.on{color:var(--tx)}
#rfm .mmain .rhead h2{border-left:4px solid var(--sec,var(--acc));padding-left:10px}
#rfm .hint{font-size:12.5px;color:var(--tx2);margin:-2px 0 12px;padding:7px 12px;border-radius:var(--r1);background:linear-gradient(90deg,color-mix(in srgb,var(--sec) 16%,transparent),transparent);border-left:3px solid var(--sec)}
#rfm .btn.ghost{background:none;border:1px solid var(--line);color:var(--tx2)}#rfm .btn.big{font-size:16px;padding:12px 22px}
#rfm .btn.go{background:var(--lc,var(--acc));color:var(--on,#fff);border:none}
#rfm .es{display:flex;flex-direction:column;align-items:center;gap:6px;padding:36px 16px;text-align:center}#rfm .es i{font-style:normal;font-size:34px;color:var(--sec,var(--acc))}#rfm .es span{color:var(--tx2);max-width:460px}
#rfm .wcard{display:flex;gap:14px;padding:14px;border-radius:var(--r2);margin-bottom:10px;background:linear-gradient(90deg,rgba(245,192,74,.10),var(--s1) 40%);border:1px solid rgba(245,192,74,.35)}
#rfm .wcard.missing,#rfm .sec-deps .wcard{background:linear-gradient(90deg,rgba(255,93,82,.10),var(--s1) 40%);border-color:rgba(255,93,82,.35)}
#rfm .wico{font-size:22px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.25);color:var(--sec);flex:none}
#rfm .wbody{flex:1}#rfm .wbody p{margin:4px 0;color:var(--tx2);font-size:13px}#rfm .wbody .fix span{color:var(--ok);font-weight:600}#rfm .wcard .hb{display:flex;flex-direction:column;gap:6px}
#rfm .uhero{display:flex;align-items:center;gap:16px;padding:18px 20px;border-radius:var(--r2);margin-bottom:10px;background:linear-gradient(120deg,rgba(31,174,91,.22),var(--s1));border:1px solid rgba(31,174,91,.35)}
#rfm .uhero>div{flex:1;display:flex;flex-direction:column;gap:3px}#rfm .uhero b{font-size:20px}#rfm .uhero span{color:var(--tx2);font-size:13px}
#rfm .tlw{border-left:2px solid var(--line);margin-left:8px;padding-left:18px}#rfm .tl{position:relative;padding:8px 0 14px}
#rfm .tl .dot{position:absolute;left:-25px;top:12px;width:12px;height:12px;border-radius:50%;background:var(--sec);box-shadow:none}#rfm .tl.ign{opacity:.55}#rfm .tl.done .dot{background:var(--tx3)}
#rfm .tlh{display:flex;gap:6px;align-items:center;flex-wrap:wrap}#rfm .vchip.new{background:rgba(31,174,91,.2);color:#6be59a}
#rfm .clog{margin:6px 0;padding:8px 12px;border-radius:var(--r1);background:var(--s1);font-size:13px;color:var(--tx2);white-space:pre-wrap;border-left:3px solid var(--sec)}#rfm .tla{display:flex;gap:4px}
#rfm .dbc.hot{border-color:rgba(31,174,91,.6)}#rfm .dbc.warn{border-color:rgba(245,192,74,.6)}#rfm .dbc.bad{border-color:rgba(255,93,82,.6)}
#rfm .dcharts{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:6px 0}#rfm .dch{background:var(--s1);border:1px solid var(--line);border-radius:var(--r2);padding:12px 14px}
#rfm .dch h4{margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--tx3)}#rfm .dchr,#rfm .dch:nth-child(3){display:flex;gap:16px;align-items:center;flex-wrap:wrap}#rfm .dch:nth-child(3) h4{width:100%}
#rfm .donut{transform:rotate(0deg)}#rfm .leg div{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--tx2)}#rfm .leg i{width:10px;height:10px;border-radius:0}
#rfm .logrid.big{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}#rfm .logrid.big .locard{border:1px solid var(--line);border-top:5px solid var(--lc)}
#rfm .logrid.big .locov{aspect-ratio:2/1}#rfm .logrid.big .locov:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,color-mix(in srgb,var(--lc) 45%,transparent))}
#rfm .logrid.big .ct{font-size:18px}
#rfm .tour{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:40}#rfm .tbox{background:var(--s2);border:1px solid var(--acc);border-radius:var(--r2);padding:22px 24px;max-width:460px}
#rfm .tbox h3{margin:6px 0}#rfm .tbox p{color:var(--tx2)}#rfm .tdots{display:flex;gap:6px;margin:10px 0}#rfm .tdots i{width:8px;height:8px;border-radius:50%;background:var(--s3)}#rfm .tdots i.on{background:var(--acc)}
#rfm .wrap[data-view="results"] .rhead h2{border-left:4px solid #2f7bff;padding-left:10px}
#rfm .wrap[data-view="servers"] .rhead h2:before{content:"● LIVE";font-size:10px;letter-spacing:1px;color:#3ecf6e;background:rgba(62,207,110,.12);padding:3px 8px;border-radius:var(--r2);margin-right:10px;vertical-align:middle}
#rfm .wrap[data-view="servers"] .mpt thead th{color:#6be59a}
#rfm .reqb{position:absolute;left:8px;bottom:8px;font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:var(--r2);background:rgba(47,123,255,.9);color:var(--on,#fff)}
#rfm .alsoi{font-size:12.5px;padding:8px 10px;border-radius:var(--r1);background:rgba(47,123,255,.12);border:1px solid rgba(47,123,255,.35);color:var(--tx2)}#rfm .alsoi b{color:var(--tx)}#rfm .alsoi span{display:block;color:var(--tx3);font-size:11.5px}
@font-face{font-family:"Overpass";src:url("/ui/ui-vue/src/assets/fonts/Overpass/static/Overpass-Regular.ttf");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:"Overpass";src:url("/ui/ui-vue/src/assets/fonts/Overpass/static/Overpass-SemiBold.ttf");font-weight:600;font-style:normal;font-display:swap}
@font-face{font-family:"Overpass";src:url("/ui/ui-vue/src/assets/fonts/Overpass/static/Overpass-Bold.ttf");font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:"Overpass";src:url("/ui/ui-vue/src/assets/fonts/Overpass/static/Overpass-BoldItalic.ttf");font-weight:700;font-style:italic;font-display:swap}
@font-face{font-family:"Noto Sans";src:url("/ui/ui-vue/src/assets/fonts/NotoSans/NotoSans-Regular.ttf");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:"Noto Sans";src:url("/ui/ui-vue/src/assets/fonts/NotoSans/NotoSans-Medium.ttf");font-weight:500;font-style:normal;font-display:swap}
@font-face{font-family:"Noto Sans";src:url("/ui/ui-vue/src/assets/fonts/NotoSans/NotoSans-SemiBold.ttf");font-weight:600;font-style:normal;font-display:swap}
@font-face{font-family:"Noto Sans";src:url("/ui/ui-vue/src/assets/fonts/NotoSans/NotoSans-Bold.ttf");font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:"rfmBngIcons";src:url("/ui/ui-vue/src/assets/fonts/bngIcons/bngIcons.woff2") format("woff2"),url("/ui/ui-vue/src/assets/fonts/bngIcons/bngIcons.woff") format("woff");font-weight:400;font-style:normal;font-display:block}
#rfm{--r1:var(--bng-corners-1,4px);--r2:var(--bng-corners-2,8px);--r:var(--r1);
  --fnt:var(--fnt-defs,"Noto Sans"),"Noto Sans","Segoe UI",Arial,sans-serif;--fh:"Overpass",var(--fnt-defs,"Noto Sans"),"Noto Sans",sans-serif;
  --pop:0 .25rem .75rem rgba(0,0,0,.6);--dlg:0 1em 4em 1em rgba(0,0,0,.3);
  --ok:var(--bng-add-green-300,#4fca7e);--warn:var(--bng-ter-yellow-100,#e7cf30);--bad:var(--bng-add-red-400,#fb6752);--info:var(--bng-add-blue-400,#45a2f9);
  --on:var(--bng-off-white,#ebebeb);
  font-family:var(--fnt);font-size:14px}
#rfm.light{--on:#fff}
#rfm ::-webkit-scrollbar{width:7px;height:7px}
#rfm ::-webkit-scrollbar-thumb{background:var(--acc);border:0;border-radius:0}#rfm ::-webkit-scrollbar-thumb:hover{background:var(--acc2)}#rfm ::-webkit-scrollbar-thumb:active{background:var(--acc3)}
#rfm ::-webkit-scrollbar-track{background:#222}#rfm ::-webkit-scrollbar-corner{background:transparent}
#rfm.light ::-webkit-scrollbar-track{background:#d9dce1}
#rfm :focus{outline:none}
#rfm :focus-visible{outline:2px solid var(--acc);outline-offset:2px;box-shadow:none}
#rfm .bi{display:inline-block;font-style:normal;font-weight:400;line-height:1;vertical-align:-.16em;text-decoration:none}
#rfm .bi::before{content:attr(data-g);font-family:"bngIcons","rfmBngIcons";font-size:1.2em;font-weight:400;font-style:normal;line-height:1;-webkit-font-smoothing:antialiased}
#rfm .bi>s{display:none}
#rfm h1,#rfm h2,#rfm h3,#rfm h4,#rfm .htitle,#rfm .dtitle,#rfm .brand,#rfm .uhero b,#rfm .dbc b,#rfm .dcards b,#rfm .ri .n,#rfm .es b,#rfm .empty b{font-family:var(--fh);font-style:italic;font-weight:800;letter-spacing:0}
#rfm .sh h3,#rfm .rhead h2{position:relative;padding-left:1.1em;border-left:0}
#rfm .sh h3::before,#rfm .rhead h2::before{content:"";position:absolute;left:.1em;top:.18em;width:.5em;height:1em;background:var(--sec,var(--acc));transform:matrix(.94,0,-.38,1,0,0)}
#rfm .mmain .rhead h2,#rfm .wrap[data-view="results"] .rhead h2{border-left:0;padding-left:1.1em}
#rfm .wrap[data-view="results"] .rhead h2::before{background:var(--acc)}
#rfm .sh h3{font-size:21px}#rfm .rhead h2{font-size:24px}
#rfm .side h5,#rfm .fsh,#rfm .sb h6,#rfm .lbl,#rfm .dch h4,#rfm .drw h4,#rfm .dlp h6,#rfm .lfp h5,#rfm .eyebrow{font-family:var(--fh);font-weight:700;font-style:normal;letter-spacing:.04em}
#rfm .nav{height:58px;background:var(--hd,rgba(0,0,0,.25));border-bottom:1px solid var(--line);gap:14px}
#rfm.light .nav{background:var(--s1)}
#rfm .brand{font-size:22px;gap:8px;font-weight:800}
#rfm .brand i{width:auto;height:auto;border-radius:0;background:none;color:var(--acc);font-size:22px;display:inline-flex}
#rfm .brand b{color:var(--tx);font-weight:800}
#rfm .tabs{gap:0;align-self:stretch;align-items:flex-end}
#rfm .tab{border-radius:var(--r1) var(--r1) 0 0;padding:0 16px;height:44px;display:flex;align-items:center;color:var(--tx2);font-weight:600;font-size:15px;background:transparent;transition:background-color .15s,color .15s}
#rfm .tab:hover{background:rgba(var(--bng-ter-blue-gray-500-rgb,106,139,161),.4);color:var(--tx)}
#rfm .tab.on{color:var(--tx);background:transparent;background-image:linear-gradient(0deg,var(--accb,var(--acc)) 4px,color-mix(in srgb,var(--accb,var(--acc)) 30%,transparent) 4px,transparent 1rem)}
#rfm .search input,#rfm input.fi,#rfm textarea.fi,#rfm select.fi,#rfm .side input.fi,#rfm .side.fx input.fi{background:var(--in,var(--s1));border:0;border-radius:var(--r1) var(--r1) 0 0;box-shadow:inset 0 -1px 0 var(--inl,var(--tx3));color:var(--tx);font-family:var(--fnt)}
#rfm .search input:focus,#rfm input.fi:focus,#rfm textarea.fi:focus,#rfm select.fi:focus,#rfm .side input.fi:focus,#rfm .side.fx input.fi:focus{background:var(--inf,var(--s2));box-shadow:inset 0 -2px 0 var(--accb,var(--acc));outline:none}
#rfm .search input{height:36px;border-radius:var(--r1) var(--r1) 0 0}
#rfm .search svg{top:9px}
#rfm .btn{height:36px;padding:0 .9em;border-radius:var(--r1);font-family:var(--fnt);font-weight:600;font-size:14px;gap:6px;box-shadow:none;transition:background-color .15s,color .15s,box-shadow .15s}
#rfm .btn:active{transform:none}
#rfm .btn.pri{background:var(--accb,var(--acc));color:var(--on);box-shadow:none}#rfm .btn.pri:hover{background:var(--acc)}#rfm .btn.pri:active{background:var(--acc3)}
#rfm .btn{background:var(--b2,var(--s3));color:var(--on)}#rfm .btn.sec{background:var(--b2,var(--s3));color:var(--on)}#rfm .btn.sec:hover{background:var(--b2h,var(--s2))}#rfm .btn.sec:active{background:var(--b2a,var(--s1))}
#rfm.light .btn.sec{color:var(--tx)}
#rfm .btn.ghost{background:rgba(0,0,0,.4);color:var(--tx);border:0;box-shadow:inset 0 0 0 2px var(--bng-cool-gray-600,#606570)}
#rfm .btn.ghost:hover{background:var(--acc3);box-shadow:inset 0 0 0 2px var(--acc);color:var(--on)}#rfm .btn.ghost:active{background:color-mix(in srgb,var(--acc3) 42%,#000);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--acc3) 66%,#000)}
#rfm.light .btn.ghost{background:transparent;box-shadow:inset 0 0 0 2px var(--line)}
#rfm .btn.bad{background:var(--bng-add-red-700,#781f14);color:var(--on);box-shadow:inset 0 0 0 2px var(--bng-add-red-650,#a01a0c)}#rfm .btn.bad:hover{background:var(--bng-add-red-600,#b12e1f)}#rfm .btn.bad:active{background:var(--bng-add-red-900,#24130f)}
#rfm .btn.done,#rfm .btn.inst-ok{background:rgba(var(--bng-add-green-500-rgb,61,156,97),.2);color:var(--ok);box-shadow:inset 0 0 0 2px rgba(var(--bng-add-green-500-rgb,61,156,97),.5)}
#rfm .btn.sup{border-radius:var(--r1)}
#rfm .btn:disabled,#rfm .btn[disabled]{opacity:.5;pointer-events:none}
#rfm .btn.lg,#rfm .btn.big,#rfm .pkbig,#rfm .rhead .pkhead{font-family:var(--fh);font-style:italic;font-weight:700;font-size:18px;height:44px;padding:0 1.1em;box-shadow:none}
#rfm .hcta .btn{font-family:var(--fh);font-style:italic;font-weight:700;font-size:18px}
#rfm .close,#rfm .gear,#rfm .dlb,#rfm .pad,#rfm .cprev,#rfm .cnext,#rfm .drw .close{border-radius:var(--r1);background:transparent;border:0;box-shadow:none}
#rfm .close:hover,#rfm .gear:hover,#rfm .dlb:hover{background:color-mix(in srgb,var(--acc3) 45%,transparent);color:var(--tx)}
#rfm .gear,#rfm .dlb{width:36px;height:36px;font-size:18px;color:var(--tx2);margin-left:0}
#rfm .dlb svg.ring{inset:0}
#rfm .dlb .bdg,#rfm .fxh .cnt,#rfm .sbi b,#rfm .bdg{border-radius:var(--r1)}
#rfm .pad{width:40px;height:64px;background:rgba(0,0,0,.6);border:0;font-size:20px}#rfm .pad:hover{background:var(--accb,var(--acc))}
#rfm .cprev,#rfm .cnext{background:rgba(0,0,0,.6);width:32px;height:44px}#rfm .cprev:hover,#rfm .cnext:hover{background:var(--accb,var(--acc))}
#rfm .drw .close{background:rgba(0,0,0,.6);width:28px;height:28px}
#rfm .chip,#rfm .cchip,#rfm .sortl span,#rfm .inst,#rfm .clrall,#rfm .jpill .jpk,#rfm .ltag,#rfm .achip{border-radius:var(--r2);border:0;background:transparent;box-shadow:inset 0 0 0 2px var(--pl,var(--line));color:var(--tx2);font-weight:600}
#rfm .chip:hover,#rfm .cchip:hover,#rfm .sortl span:hover,#rfm .inst:hover,#rfm .clrall:hover,#rfm .jpill .jpk:hover,#rfm .ltag:hover{color:var(--tx);background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 2px var(--plh,var(--tx3));transform:none}
#rfm .chip.on,#rfm .cchip.on,#rfm .sortl span.on,#rfm .jpill .jpk.on,#rfm .ltag.on{background:var(--pm,var(--s3));box-shadow:inset 0 0 0 2px var(--pm,var(--s3)),inset 0 -3px 0 var(--acc);color:var(--tx)}
#rfm .achip{background:var(--pm,var(--s3));box-shadow:inset 0 0 0 2px var(--pm,var(--s3)),inset 3px 0 0 var(--acc);color:var(--tx);animation:none}
#rfm .ltag.add,#rfm .ltag.sug{box-shadow:inset 0 0 0 1px var(--line);border:0;background:transparent}
#rfm .vchip,#rfm .cdet .tg span,#rfm .pkst,#rfm .pkwhere,#rfm .badge-s,#rfm .reqb,#rfm .liss,#rfm .pfx,#rfm .badge{border-radius:var(--r1)}
#rfm .vchip.st{box-shadow:inset 0 0 0 1px var(--acc)}
#rfm .seg,#rfm .vsw{border-radius:var(--r1);background:rgba(0,0,0,.4);border:0;padding:2px;gap:2px}
#rfm .seg span,#rfm .seg b,#rfm .vsw span{border-radius:var(--r1);color:var(--tx2)}
#rfm .seg span:hover,#rfm .seg b:hover,#rfm .vsw span:hover{background:rgba(255,255,255,.08);color:var(--tx)}
#rfm .seg span.on,#rfm .seg b.on,#rfm .vsw span.on{background:var(--pm,var(--s3));color:var(--tx);box-shadow:inset 0 -3px 0 var(--acc)}
#rfm .tog i{width:31px;height:18px;border-radius:2em;background:var(--bng-cool-gray-600,#606570)}
#rfm .tog i:after{left:0;top:0;width:18px;height:18px;border-radius:50%;background:var(--bng-off-white,#ebebeb);transform:translateX(0) scale(.8);transition:transform .15s ease-in-out,background-color .15s ease-in-out}
#rfm .tog.on i{background:var(--bng-off-white,#ebebeb)}#rfm .tog.on i:after{transform:translateX(13px) scale(.8);background:var(--acc3)}
#rfm.light .tog i{background:#b9bdc6}#rfm.light .tog.on i{background:#2a2d33}
#rfm .ck{border-radius:var(--r1)}
#rfm .ck i,#rfm .cb i{border-radius:2px;border:2px solid var(--tx3)}#rfm .ck.rad i{border-radius:50%}
#rfm .ck.on i,#rfm .cb.on i{background:var(--acc3);border-color:var(--acc)}
#rfm input[type=range].rg{height:4px;border-radius:0;background:linear-gradient(90deg,var(--acc) 0,var(--acc) var(--p,0%),var(--bng-cool-gray-600,#606570) var(--p,0%))}
#rfm input[type=range].rg::-webkit-slider-thumb{width:16px;height:16px;border-radius:50%;background:var(--bng-off-white,#ebebeb);border:3px solid var(--acc3);box-shadow:none;transition:none}
#rfm input[type=range].rg:hover::-webkit-slider-thumb,#rfm input[type=range].rg:focus::-webkit-slider-thumb{transform:none;border-color:var(--acc)}
#rfm .pbar,#rfm .catpanel .bar,#rfm .mpjbar,#rfm .rowpb,#rfm .welprev .pbar{border-radius:0;background:rgba(255,255,255,.15)}
#rfm.light .pbar,#rfm.light .catpanel .bar,#rfm.light .mpjbar{background:rgba(0,0,0,.12)}
#rfm .cimg .cpb{height:4px}
#rfm .card,#rfm .lcard,#rfm .locard,#rfm .vg,#rfm .skc,#rfm .crow,#rfm .lrow{border-radius:var(--r1);border:0;background:var(--s1)}
#rfm .card:hover,#rfm .crow:hover,#rfm .cdet:hover,#rfm .gtile:hover,#rfm .lcard:hover,#rfm .locard:hover{outline:2px solid var(--acc);outline-offset:2px;background:var(--s1)}
#rfm .lcard.sel,#rfm .lrow.sel{outline:2px solid var(--acc);outline-offset:-2px}
#rfm .cdet,#rfm .gtile,#rfm .vg-g,#rfm .skd,#rfm .skg,#rfm .skr{border-radius:var(--r1)}
#rfm .cimg,#rfm .lth,#rfm .locov{background:linear-gradient(to bottom,rgba(var(--bng-cool-gray-800-rgb,40,43,51),.05),rgba(var(--bng-cool-gray-800-rgb,40,43,51),.6))}
#rfm .ph{background:var(--s2)}
#rfm .cbody{padding:10px 12px 12px}
#rfm .ct{font-weight:700}
#rfm .crow .th,#rfm .cdet .th,#rfm .lrth,#rfm .dli .tn,#rfm .hli .tn,#rfm .ri .tn,#rfm .car,#rfm .gal .main,#rfm .gal .strip img{border-radius:var(--r1)}
#rfm .logrid.big .locard{border:0;border-top:4px solid var(--lc);border-radius:var(--r1)}
#rfm .logrid.big .locov:after{background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.55))}
#rfm .badge{font-weight:700;font-size:11px;padding:3px 7px;letter-spacing:0}
#rfm .b-current{background:var(--bng-add-green-500,#3d9c61);color:var(--bng-off-white,#ebebeb)}
#rfm .b-previous{background:var(--bng-ter-yellow-300,#c7b22d);color:var(--bng-off-black,#0f0f0f)}
#rfm .b-outdated{background:var(--bng-add-red-600,#b12e1f);color:var(--bng-off-white,#ebebeb)}
#rfm .b-unknown{background:var(--bng-cool-gray-600,#606570);color:var(--bng-off-white,#ebebeb)}
#rfm .pfx{background:rgba(0,0,0,.6);color:var(--acc2)}#rfm .pfx.pin{background:var(--bng-add-blue-600,#0067b2);color:var(--on)}
#rfm .cu b,#rfm .upbig b{color:var(--bng-add-blue-300,#71b3f7)}
#rfm .st{color:var(--bng-ter-yellow-100,#e7cf30)}
#rfm .stars span.on,#rfm .stars:hover span{color:var(--bng-ter-yellow-100,#e7cf30)}
#rfm .side.fx,#rfm .sb,#rfm .drw,#rfm .panel,#rfm .lform,#rfm .dbc,#rfm .dch,#rfm .dcards div,#rfm .hrow,#rfm .active,#rfm .lfp,#rfm .cmp,#rfm .descb,#rfm .welprev,#rfm .bulk,#rfm .uhero,#rfm .wcard,#rfm .pkfile,#rfm .pkbox .pkl{background:var(--pn,var(--s1));border:0;border-radius:var(--r2);box-shadow:none}
#rfm .fxh{background:var(--pnh,var(--s1));border-bottom:1px solid var(--line)}
#rfm .fsh:hover,#rfm .ck:hover,#rfm .sbi:hover,#rfm .hli:hover,#rfm .ri:hover,#rfm .dli:hover,#rfm .ac div:hover,#rfm .mpt tbody tr:hover{background:rgba(var(--bng-ter-blue-gray-500-rgb,106,139,161),.25)}
#rfm .dbc.lnk:hover{box-shadow:inset 0 0 0 2px var(--acc)}
#rfm .dbc.hot{box-shadow:inset 3px 0 0 var(--ok)}#rfm .dbc.warn{box-shadow:inset 3px 0 0 var(--warn)}#rfm .dbc.bad{box-shadow:inset 3px 0 0 var(--bad)}
#rfm .dbc i{color:var(--acc);font-size:20px}
#rfm .cmp{box-shadow:inset 0 0 0 2px var(--acc)}
#rfm .sbi{border-radius:var(--r1)}
#rfm .sbi.on{background:rgba(var(--bng-ter-blue-gray-500-rgb,106,139,161),.4);color:var(--tx);box-shadow:inset 3px 0 0 var(--acc)}
#rfm .sbi.on i{color:var(--acc)}
#rfm .sbi b.hot{background:var(--accb,var(--acc));color:var(--on)}
#rfm .hmain{border-radius:var(--r2);background:var(--bng-off-black,#0f0f0f)}
#rfm .hbg{display:none}
#rfm .hshade{background:linear-gradient(90deg,rgba(0,0,0,.85) 0,rgba(0,0,0,.55) 40%,transparent 70%),linear-gradient(0deg,rgba(0,0,0,.6),transparent 45%)}
#rfm .htitle{font-size:42px;line-height:1.1;text-shadow:none}
#rfm .hli{border-radius:var(--r1)}#rfm .hli.on{background:rgba(var(--bng-ter-blue-gray-500-rgb,106,139,161),.4)}
#rfm .hli .bar{height:3px}
#rfm .dhero .hbg{display:block;filter:none;opacity:.25}
#rfm .dhero .hshade{background:linear-gradient(0deg,var(--bg) 0,rgba(0,0,0,.35) 60%,rgba(0,0,0,.55))}
#rfm .ri{border-radius:var(--r1)}#rfm .ri .n{font-size:24px}
#rfm .lmsg,#rfm .est,#rfm .hint,#rfm .alsoi,#rfm .wcard,#rfm .uhero{--tc:var(--ok);border:0;border-radius:var(--r2);background:linear-gradient(90deg,var(--tc) 0 6px,color-mix(in srgb,var(--tc) 30%,transparent) 6px,transparent 60%),var(--tb,var(--bng-cool-gray-800,#282b33));box-shadow:none;padding-left:16px}
#rfm .lmsg.error,#rfm .wcard.missing,#rfm .sec-deps .wcard{--tc:var(--bad)}
#rfm .est,#rfm .wcard{--tc:var(--warn)}#rfm .hint{--tc:var(--sec,var(--acc))}#rfm .alsoi{--tc:var(--info)}
#rfm .est{color:var(--tx)}
#rfm.light .lmsg,#rfm.light .est,#rfm.light .hint,#rfm.light .alsoi,#rfm.light .wcard,#rfm.light .uhero{--tb:var(--s1)}
#rfm .wico{border-radius:var(--r1);background:rgba(0,0,0,.3)}
#rfm .mpred{border-radius:var(--r2);border:0;box-shadow:inset 6px 0 0 #fff;background:var(--bng-add-red-600,#b12e1f)}
#rfm .mpred h3{font-family:var(--fh);font-style:italic}
#rfm .dlp,#rfm .catpanel,#rfm .ac{background:var(--pp,var(--s2));border:0;border-radius:var(--r2);box-shadow:var(--pop)}
#rfm .mpdet{background:var(--pp,var(--s2));border-left:1px solid var(--line);box-shadow:var(--pop);top:58px}
#rfm .jpill{border:0;border-radius:var(--r2);background:linear-gradient(90deg,var(--acc) 0 6px,color-mix(in srgb,var(--acc) 25%,transparent) 6px,transparent 60%),var(--tb,var(--bng-cool-gray-800,#282b33));box-shadow:0 .75rem 2rem rgba(0,0,0,.45);padding:10px 12px 10px 18px}
#rfm.light .jpill{--tb:var(--s1)}
#rfm .modal,#rfm .tour{background:rgba(85,85,85,.5)}
#rfm .mbox,#rfm .tbox{background:var(--dg,#252525);border:0;border-radius:var(--r2);box-shadow:var(--dlg);padding:0 20px 18px;overflow:hidden}
#rfm .mbox>h3:first-child,#rfm .mbox>.phnote:first-child,#rfm .tbox>.phnote:first-child{display:block;margin:0 -20px 14px;padding:10px 20px;background:var(--dgh,#333);font-size:15px}
#rfm .mbox>.phnote:first-child+h3,#rfm .tbox>.phnote:first-child+h3{margin-top:0}
#rfm .mbox>.phnote:first-child,#rfm .tbox>.phnote:first-child{color:var(--tx);font-family:var(--fh);font-style:italic;font-weight:700}
#rfm .mbox>:not(:first-child):not(h3):first-of-type{margin-top:16px}
#rfm.light .mbox,#rfm.light .tbox{--dg:var(--s1);--dgh:var(--s3)}
#rfm .tdots i{border-radius:0;width:16px;height:4px;transform:skewX(-20deg)}
#rfm .mpt th{background:var(--s1);font-family:var(--fh);font-weight:700}
#rfm .mpt tr.on{background:rgba(var(--bng-ter-blue-gray-500-rgb,106,139,161),.4)}
#rfm .wrap[data-view="servers"] .rhead h2:before{content:"";background:var(--acc);padding:0;margin:0;border-radius:0;font-size:inherit;letter-spacing:0;vertical-align:baseline}
#rfm .wrap[data-view="servers"] .rhead h2 .live{font-family:var(--fnt);font-style:normal}
#rfm .wrap[data-view="servers"] .mpt thead th{color:var(--tx2)}
#rfm .acsw i{border-radius:var(--r1);box-shadow:inset 0 0 0 1px var(--line);border:0}
#rfm .acsw.on i{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--tx)}
#rfm .thc{border-radius:var(--r2)}#rfm .thp i{border-radius:0}
#rfm .welprev .tabx{border-radius:var(--r1) var(--r1) 0 0;box-shadow:none;background:transparent;background-image:linear-gradient(0deg,var(--accb,var(--acc)) 4px,color-mix(in srgb,var(--accb,var(--acc)) 30%,transparent) 4px,transparent 1rem)}
#rfm .sk{background:var(--s2);animation:rfmPulse 1s ease-in-out infinite}
@keyframes rfmPulse{50%{opacity:.5}}
#rfm .tl .dot{border-radius:0;transform:skewX(-20deg);box-shadow:none}
#rfm .leg i{border-radius:0}
#rfm.light{--pn:var(--s1);--pnh:var(--s1);--pp:var(--s1);--pm:var(--s3);--in:var(--s2);--inf:var(--s1);--b2:var(--s3);--b2h:#d3d6db;--b2a:#c4c8cf}
#rfm.perf .card:hover,#rfm.perf .crow:hover,#rfm.perf .cdet:hover,#rfm.perf .gtile:hover{outline-offset:-2px}
`;

const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
const ICON_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 4h2l2.4 11h10.8L21 7H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>';
const WITHIN = [["", "Any"], ["week", "Week"], ["month", "Month"], ["3months", "3 months"], ["year", "Year"]];
const STATUSES = ["Stable", "Beta", "Alpha", "Experimental"];
const VTYPES = [["car", "Car"], ["truck", "Truck"], ["bus", "Bus"], ["bike", "Bike"], ["trailer", "Trailer"]];
const MINDL = [[0, "Any"], [1000, "1K+"], [10000, "10K+"], [100000, "100K+"], [1000000, "1M+"]];
const MINRT = [[0, "Any"], [3, "3★+"], [4, "4★+"], [4.5, "4.5★+"]];
const SORTS = [["relevance", "Best match"], ["popular", "Trending"], ["downloads", "Most downloaded"], ["rating", "Top rated"], ["updated", "Recently updated"]];
const PERIODS = [["today", "Today"], ["week", "Week"], ["month", "Month"], ["year", "Year"], ["all", "All time"]];

// Lua tables arrive as JSON: empty or sparse lists become objects ({}), not arrays
export const toArr = v => Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : [];
const LIST_FIELDS = ["hero", "forYou", "recent", "shelves", "items", "images", "categories", "featured", "gallery", "top"];
export function normalize(d) {
  if (!d || typeof d !== "object") return {};
  for (const k of LIST_FIELDS) if (k in d) d[k] = toArr(d[k]);
  if (d.shelves) d.shelves = d.shelves.filter(x => x && typeof x === "object").map(sh => ({ ...sh, items: toArr(sh.items) }));
  if (d.item && typeof d.item === "object") d.item = { ...d.item };
  return d;
}

const normCls = c => String(c || "").split(/\s+/).filter(Boolean).join(" ");
export const BNG_GLYPHS = { "✓": "\u{ec53}", "✕": "\u{ee54}", "⚠": "\u{ee4f}", "⬇": "\u{ecb5}", "⬆": "\u{ebf9}", "↻": "\u{eda3}", "⟳": "\u{eda3}", "⟲": "\u{edb2}", "⛓": "\u{ecd8}", "⧉": "\u{ec5d}", "▤": "\u{ecdb}", "▣": "\u{ec45}", "◉": "\u{edb1}", "◔": "\u{ec91}", "✚": "\u{edf9}", "⇅": "\u{ed6e}", "☑": "\u{ec51}", "☐": "\u{ec50}", "▦": "\u{edb1}", "☰": "\u{ecdb}", "⌕": "\u{ed70}", "▶": "\u{ed35}", "⤢": "\u{efb4}", "▾": "\u{ebfa}", "▴": "\u{ebfd}", "↓": "\u{ebfa}", "⛽": "\u{ec0e}", "⚙": "\u{efac}", "🔔": "\u{ee23}", "📂": "\u{ec93}", "📁": "\u{ec93}", "📄": "\u{f045}", "📌": "\u{ee4a}", "🌐": "\u{eca2}", "🔒": "\u{ecde}", "🗑": "\u{edd5}", "♻": "\u{eede}", "♥": "\u{ee2a}", "🚗": "\u{ec44}", "✈": "\u{eedd}", "📦": "\u{ec45}", "🚤": "\u{eed8}", "🎬": "\u{ec56}", "🗺": "\u{edad}", "🖥": "\u{f049}", "🔊": "\u{ed84}", "🔢": "\u{eee3}", "🧩": "\u{ed46}", "🎨": "\u{ed90}" };
const BNG_EXPLICIT = { "‹": "\u{ebfb}", "›": "\u{ebfc}", "«": "\u{ebf7}", "»": "\u{ebf8}", "★": "\u{ed92}", "☆": "\u{ed93}", "?": "\u{ecaa}" };
const GLYPH_RE = new RegExp("<textarea[\\s\\S]*?</textarea>|<[^>]*>|(" + Object.keys(BNG_GLYPHS).join("|") + ")\\uFE0F?", "gu");
export function bi(ch, cls = "") { const g = BNG_GLYPHS[ch] || BNG_EXPLICIT[ch]; return g ? `<i class="bi${cls ? " " + cls : ""}" data-g="${g}" aria-hidden="true"><s>${ch}</s></i>` : ch; }
// swaps the symbols in text (never inside tags or textareas) for bngIcons glyphs; one pass, no DOM work
export function iconize(html) { return typeof html === "string" && html ? html.replace(GLYPH_RE, (m, ch) => ch ? bi(ch) : m) : html; }
export function morph(a, b) {
  if (a.nodeType === 3 || a.nodeType === 8) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  const setCls = v => { if (normCls(a.getAttribute("class")) !== v) a.setAttribute("class", v); };
  if (a.nodeName === "IMG") {
    const ns = b.getAttribute("src"), os = a.getAttribute("src");
    for (const at of Array.from(b.attributes)) if (at.name !== "src" && at.name !== "class" && a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    for (const at of Array.from(a.attributes)) if (at.name !== "src" && at.name !== "class" && !b.hasAttribute(at.name)) a.removeAttribute(at.name);
    const loaded = a.classList.contains("ld"), cls = normCls(b.getAttribute("class"));
    const withLd = normCls(cls + " ld");
    if (ns !== os) {
      if (loaded && typeof Image !== "undefined") { // swap after the new image is ready: no blank flash
        const pre = new Image(); pre.onload = () => { if (a.getAttribute("src") !== ns) a.setAttribute("src", ns); a.classList.add("ld"); }; pre.src = ns;
        setCls(withLd);
      } else { a.setAttribute("src", ns); setCls(cls); }
    } else setCls(loaded ? withLd : cls);
    return;
  }
  for (const at of Array.from(b.attributes)) {
    if (at.name === "class") { setCls(normCls(at.value)); continue; }
    if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
  }
  for (const at of Array.from(a.attributes)) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  const keyOf = n => n.nodeType === 1 ? n.getAttribute("data-key") : null;
  const keyed = new Map();
  for (const c of Array.from(a.childNodes)) { const k = keyOf(c); if (k) keyed.set(k, c); }
  let i = 0;
  const bKids = Array.from(b.childNodes);
  for (const nb of bKids) {
    const k = keyOf(nb);
    let match = null;
    if (k) { match = keyed.get(k) || null; if (match) keyed.delete(k); }
    else {
      const cand = a.childNodes[i];
      if (cand && !keyOf(cand) && cand.nodeName === nb.nodeName) match = cand;
    }
    const ref = a.childNodes[i] || null;
    if (match) { if (match !== ref) a.insertBefore(match, ref); morph(match, nb); }
    else a.insertBefore(nb.cloneNode(true), ref);
    i++;
  }
  while (a.childNodes.length > bKids.length) a.removeChild(a.lastChild);
}

// ---- downloads ----
const DL_STATE = { waiting: "queued", queued: "queued", pending: "queued", subscribed: "queued", missing: "queued",
  downloading: "downloading", working: "downloading", updating: "downloading", started: "downloading", progress: "downloading",
  downloaded: "done", done: "done", finished: "done", installed: "done", success: "done", complete: "done", completed: "done",
  error: "failed", failed: "failed", failure: "failed", canceled: "failed", cancelled: "failed" };
const baseName = u => { const m = String(u || "").split(/[?#]/)[0].split("/").filter(Boolean); return m.length ? m[m.length - 1] : ""; };
function isEntry(o) { return o && typeof o === "object" && ["state", "dlnow", "dltotal", "progress", "id", "modID", "modId", "tagid", "filename"].some(k => k in o); }
export function normalizeDownloads(data) {
  if (data == null) return [];
  let list = data;
  if (!Array.isArray(list) && typeof list === "object" && !isEntry(list)) {
    list = list.queue || list.updateQueue || list.downloads || list.requests || list.data || list.items || list;
  }
  list = isEntry(list) && !Array.isArray(list) ? [list] : toArr(list);
  const num = v => { const n = Number(v); return isFinite(n) ? n : undefined; };
  const out = [];
  for (const e of list) {
    if (!e || typeof e !== "object") continue;
    const id = e.id ?? e.modID ?? e.modId ?? e.tagid ?? e.tag_id ?? e.mod_id;
    const file = e.filename || e.fname || e.fileName || baseName(e.outfile || e.uri || e.url || e.effectiveURL) || undefined;
    if (id == null && !file) continue;
    let state = DL_STATE[String(e.state || e.status || "").toLowerCase()];
    if (e.error || e.err || e.ok === false) state = "failed";
    let progress = num(e.progress ?? e.percent);
    if (progress !== undefined && progress > 1) progress = progress / 100;
    const now = num(e.dlnow ?? e.done ?? e.downloaded ?? e.bytes ?? e.current);
    const total = num(e.dltotal ?? e.total ?? e.size ?? e.filesize);
    if (!state) state = (now || progress) ? "downloading" : "queued";
    if (state === "downloading" && total && now >= total && total > 0 && e.state === "finished") state = "done";
    out.push({ id: id == null ? undefined : String(id), file, state, now, total, speed: num(e.dlspeed ?? e.speed), progress,
      error: e.error || e.err || undefined, title: e.title || e.modname || undefined, pack: e.pack || undefined });
  }
  return out;
}

const Q_STATE = { waiting: "available", updating: "queued", downloading: "downloading", downloaded: "installing", done: "done" };
const modIdFromUri = u => { const m = /download\/mods\/([^/?#]+)\//.exec(String(u || "")); return m ? m[1] : undefined; };
function fromRequest(r) {
  if (!r || typeof r !== "object") return null;
  const url = r.uri || r.url || r.effectiveURL || "";
  if (!r.outfile && !/\/download\/mods\//.test(url)) return null; // not a mod download (API calls etc.)
  const failed = !!r.error || (r.state === "finished" && r.responseCode != null && Number(r.responseCode) !== 200);
  const n = v => { const x = Number(v); return isFinite(x) ? x : undefined; };
  return { id: modIdFromUri(url), file: r.filename || baseName(r.outfile) || baseName(url) || undefined,
    state: failed ? "failed" : r.state === "finished" ? "installing" : "downloading",
    now: n(r.dlnow), total: n(r.dltotal) || undefined, speed: n(r.dlspeed), error: r.error || (failed ? "HTTP " + r.responseCode : undefined) };
}
function fromQueue(e, forced) {
  if (!e || typeof e !== "object" || e.id == null) return null;
  const n = v => { const x = Number(v); return isFinite(x) ? x : undefined; };
  let state = forced || Q_STATE[String(e.state || "").toLowerCase()] || "available";
  return { id: String(e.id), file: e.filename, state, now: n(e.dlnow), total: n(e.dltotal) || undefined,
    speed: n(e.dlspeed ?? e.speed) || undefined, title: e.title || e.modname || undefined, action: e.action || e.reason };
}
export function normalizeGameEvent(name, data) {
  const out = [];
  const push = x => { if (x) out.push(x); };
  try {
    if (name === "downloadStatesChanged" || name === "OnlineRequestsState") toArr(data).forEach(r => push(fromRequest(r)));
    else if (name === "downloadStateChanged") push(fromRequest(data));
    else if (name === "UpdateQueueState" && data && typeof data === "object") {
      toArr(data.updatingList).forEach(e => push(fromQueue(e)));
      toArr(data.doneList).forEach(e => push(fromQueue(e, "done")));
      toArr(data.missingList).forEach(e => push(fromQueue(e, e.state === "updating" || e.state === "downloading" ? undefined : "available")));
    }
    else if (name === "RepoModChangeStatus") push(fromQueue(data));
    else if (name === "ModDownloaded" && data && data.modID != null) out.push({ id: String(data.modID), state: "installing" });
    else if (name === "ModSubscribed" && data && typeof data === "object") {
      const md = data.modData || data; const id = md.tagid || md.id;
      if (id != null) out.push({ id: String(id), file: md.filename, state: "queued", sub: true });
    }
  } catch (e) { } /* malformed event: ignore */
  return out.filter(x => x.id != null || x.file);
}

export function createDownloadTracker(clock = () => Date.now()) {
  const map = new Map(), fileToId = new Map();
  const key = e => (e.id != null ? "i:" + e.id : fileToId.has(e.file) ? "i:" + fileToId.get(e.file) : "f:" + e.file);
  function learnFile(id, file) { if (id != null && file) fileToId.set(file, String(id)); }
  const STALE_MS = 30000;
  function update(list) {
    const t = clock();
    for (const e of list) {
      if (e.state === "available") continue;
      if (e.id != null && e.file) learnFile(e.id, e.file);
      const k = key(e);
      const cur = map.get(k) || { id: e.id ?? (k.startsWith("i:") ? k.slice(2) : undefined), file: e.file, state: "queued", now: 0, total: 0, speed: 0, eta: null, t0: t };
      if (e.file) cur.file = e.file;
      if (e.title) cur.title = e.title;
      if (e.pack) cur.pack = e.pack; // downloads started by a Mod Pack import
      if (e.game) cur.seen = true;
      else if (e.state === "queued") { cur.req = t; if (e.retry || cur.state === "failed") cur.seen = false; }
      if (cur.state === "done" && e.state === "queued" && !e.retry) { cur.t = t; map.set(k, cur); continue; } // stale queue echo
      const prevNow = cur.now, prevT = cur.t;
      if (e.total) cur.total = e.total;
      if (e.now !== undefined) cur.now = e.now;
      else if (e.progress !== undefined && cur.total) cur.now = e.progress * cur.total;
      if (e.progress !== undefined) cur.progress = e.progress;
      else if (cur.total) cur.progress = Math.min(1, cur.now / cur.total);
      // speed: game value if given, else derived; exponential smoothing keeps ETA steady
      let sample = e.speed;
      if (sample === undefined && prevT !== undefined && t > prevT && cur.now >= prevNow) sample = (cur.now - prevNow) / ((t - prevT) / 1000);
      if (sample !== undefined && isFinite(sample) && e.state === "downloading") cur.speed = cur.speed ? cur.speed * 0.75 + sample * 0.25 : sample;
      cur.state = e.state;
      cur.error = e.state === "failed" ? (e.error || "Download failed") : undefined;
      if (cur.state === "done" || cur.state === "installing") { cur.progress = 1; if (cur.total) cur.now = cur.total; cur.speed = 0; }
      if (cur.state === "done") cur.doneAt = t;
      cur.eta = cur.state === "downloading" && cur.speed > 0 && cur.total ? Math.max(0, (cur.total - cur.now) / cur.speed) : null;
      cur.t = t;
      map.set(k, cur);
    }
    // keep the list short: at most 15 finished entries
    const fin = [...map.entries()].filter(([, v]) => v.state === "done").sort((a, b) => b[1].doneAt - a[1].doneAt);
    fin.slice(15).forEach(([k]) => map.delete(k));
  }
  let prevInstalled = null;
  function markInstalled(ids) {
    const set = new Set(toArr(ids).map(String)); let changed = false;
    const fresh = id => !prevInstalled || !prevInstalled.has(id);
    for (const v of map.values()) if (v.id != null && set.has(String(v.id)) && (v.state === "queued" || v.state === "downloading" || v.state === "installing") && (fresh(String(v.id)) || v.progress >= 0.99)) {
      v.state = "done"; v.progress = 1; v.speed = 0; v.eta = null; v.doneAt = clock(); changed = true; }
    prevInstalled = set;
    return changed;
  }
  function tick() {
    const t = clock(); let changed = false;
    for (const v of map.values()) if (v.state === "installing" && t - v.t > STALE_MS) { v.state = "failed"; v.error = "Download failed (see game console)"; changed = true; }
    return changed;
  }
  const ORDER = { downloading: 0, installing: 1, queued: 2, failed: 3, done: 4 };
  const list = () => [...map.values()].sort((a, b) => (ORDER[a.state] - ORDER[b.state]) || (b.t0 - a.t0));
  const active = () => list().filter(v => v.state === "downloading" || v.state === "queued" || v.state === "installing");
  function overall() {
    const a = active(); if (!a.length) return null;
    let n = 0, t = 0; for (const v of a) { if (v.total) { n += v.now || 0; t += v.total; } }
    return t ? n / t : 0;
  }
  const get = id => map.get("i:" + id);
  const unseen = (minAge = 0) => { const t = clock(); return [...map.values()].filter(v => v.state === "queued" && !v.seen && v.id != null && v.req != null && t - v.req >= minAge); };
  function failMissing(listed, minAge, reason, afterError) {
    const t = clock(); let n = 0;
    const inQ = id => listed != null && listed.has(String(id));
    if (listed == null) minAge = Math.max(minAge, 60000);
    for (const v of map.values()) {
      if (v.id == null || inQ(v.id)) continue;
      const lost = v.state === "queued" && !v.seen && v.req != null && t - v.req >= minAge;
      const dropped = afterError && listed != null && v.seen && (v.state === "queued" || v.state === "downloading" || v.state === "installing") && t - v.t >= Math.max(minAge, 3000);
      if (lost || dropped) { v.state = "failed"; v.error = reason || "Download failed"; v.speed = 0; v.eta = null; v.t = t; n++; }
    }
    return n;
  }
  return { update, markInstalled, tick, list, active, overall, get, learnFile, unseen, failMissing, clear: () => { for (const [k, v] of map) if (v.state === "done") map.delete(k); } };
}

export function createMarket(doc, lua, opts = {}) {
  const win = doc.defaultView || window;
  const st = { view: "home", home: null, results: null, top: null, period: "week", detail: null, hello: null,
    heroIdx: 0, q: "", cats: new Set(), hideOutdated: false, onlyCurrent: false, hideUnstable: false, sort: "relevance",
    reqId: 0, subscribed: new Set(), shot: 0, rails: {}, limit: 60, catalog: null, loadingMore: false,
    f: defaultFilters(), bview: "grid", fclosed: new Set(["vtype", "author", "more"]), authors: null, installed: new Set(), inst: null, dlOpen: false, titles: new Map(), reqs: new Map(), planFor: null };
  const dl = createDownloadTracker(opts.clock);
  function defaultFilters() { return { updatedWithin: "", minSizeMB: "", maxSizeMB: "", minDownloads: 0, minRating: 0, author: "",
    hideSubscribed: false, statuses: [], vehicleTypes: [], hasPhotos: false }; }
  const FKEY = "marketplaceMod.filters.v1";
  function store() { try { return opts.storage || win.localStorage; } catch (e) { return null; } }
  const STORE_KEYS = ["filters.v1", "browseView.v1", "filterSections.v1", "accent.v1", "accentChosen.v1", "notes", "tourDone", "hideAutomation", "perf"];
  (function migrateStore() {
    const s = store(); if (!s) return;
    for (const k of STORE_KEYS) {
      try { const v = s.getItem("repoFinder." + k); if (v != null && s.getItem("marketplaceMod." + k) == null) s.setItem("marketplaceMod." + k, v); } catch (e) { } /* ignore */
    }
  })();
  function saveFilters() {
    const s = store(); if (!s) return;
    try { s.setItem(FKEY, JSON.stringify({ f: st.f, cats: [...st.cats], hideOutdated: st.hideOutdated, onlyCurrent: st.onlyCurrent,
      hideUnstable: st.hideUnstable, sort: st.sort, fv: 2 })); } catch (e) { } /* storage full / disabled */
  }
  loadFilters();
  function loadView() { const s = store(); if (!s) return; try { const v = s.getItem("marketplaceMod.browseView.v1"); if (["grid", "compact", "detailed", "gallery"].includes(v)) st.bview = v;
    const c = JSON.parse(s.getItem("marketplaceMod.filterSections.v1") || "null"); if (Array.isArray(c)) st.fclosed = new Set(c); } catch (e) { } } /* ignore */
  function saveView() { const s = store(); if (!s) return; try { s.setItem("marketplaceMod.browseView.v1", st.bview); s.setItem("marketplaceMod.filterSections.v1", JSON.stringify([...st.fclosed])); } catch (e) { } } /* ignore */
  function loadFilters() {
    loadView();
    const s = store(); if (!s) return;
    try {
      const d = JSON.parse(s.getItem(FKEY) || "null"); if (!d || typeof d !== "object") return;
      st.f = Object.assign(defaultFilters(), d.f || {});
      st.f.statuses = toArr(st.f.statuses); st.f.vehicleTypes = toArr(st.f.vehicleTypes);
      st.cats = new Set(toArr(d.cats).map(Number));
      for (const k of ["hideOutdated", "onlyCurrent", "hideUnstable"]) if (typeof d[k] === "boolean") st[k] = d[k];
      if (typeof d.sort === "string") st.sort = d.sort;
      if ((d.fv || 1) < 2) { st.hideOutdated = false; saveFilters(); }
    } catch (e) { } /* ignore corrupt */
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n || 0);
  const fmtSize = b => b ? (b >= 1073741824 ? (b / 1073741824).toFixed(1) + " GB" : (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + " MB") : "";
  const stars = r => { const n = Math.round(r || 0); return "★".repeat(n) + "<span style='opacity:.25'>" + "★".repeat(5 - n) + "</span>"; };
  const rel = t => { if (!t) return "?"; const d = Math.floor(((opts.now || Date.now()) / 1000 - t) / 86400);
    return d < 1 ? "today" : d < 2 ? "yesterday" : d < 30 ? d + " days ago" : d < 365 ? Math.floor(d / 30) + " mo ago" : Math.floor(d / 365) + " yr ago"; };
  const badgeTxt = m => m.compat === "current" ? "✓ " + ((st.hello && st.hello.gameMajor) || "") : m.compat === "previous" ? "Probably OK" : m.compat === "outdated" ? "Last updated " + monYear(m.updated) : "Version ?";
  function monYear(t) { t = +t; if (!t) return "?"; const d = new Date(t * 1000); return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  const call = (fn, arg) => lua(`extensions.load("marketplaceMod"); extensions.marketplaceMod.${fn}(${arg === undefined ? "" : arg})`);
  const wellFormed = s => {
    if (typeof s.toWellFormed === "function") return s.toWellFormed();
    if (!/[\uD800-\uDFFF]/.test(s)) return s;
    let o = "";
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) { const d = s.charCodeAt(i + 1); if (d >= 0xDC00 && d <= 0xDFFF) { o += s[i] + s[i + 1]; i++; } else o += "\uFFFD"; }
      else o += (c >= 0xDC00 && c <= 0xDFFF) ? "\uFFFD" : s[i];
    }
    return o;
  };
  // cut to n UTF-16 units without leaving half an emoji behind
  const cutStr = (v, n) => { let t = String(v || "").slice(0, n); if (/[\uD800-\uDBFF]$/.test(t)) t = t.slice(0, -1); return t; };
  const luaStr = v => JSON.stringify(wellFormed(String(v)))
    .replace(/(\\+)u([0-9a-fA-F]{4})/g, (m, bs, h) => bs.length % 2 ? bs.slice(0, -1) + "\\u{" + h + "}" : m);
  const toLua = v => Array.isArray(v) ? "{" + v.map(toLua).join(",") + "}"
    : v && typeof v === "object" ? "{" + Object.keys(v).map(k => `${k}=${toLua(v[k])}`).join(",") + "}"
    : typeof v === "string" ? luaStr(v) : (typeof v === "boolean" || typeof v === "number") ? (Number.isFinite(v) || typeof v === "boolean" ? String(v) : "nil") : "nil";
  const isSub = m => m.sub || st.subscribed.has(m.id);
  const badImg = new Set();
  const goodSrc = (src, fb) => src && !badImg.has(src) ? src : (fb && !badImg.has(fb) ? fb : "");
  const img = (src, cls = "", fb = "") => { const s2 = goodSrc(src, fb); fb = s2 === fb ? "" : fb;
    return s2 ? `<img class="im ${cls}" src="${esc(s2)}"${fb && fb !== s2 ? ` data-fb="${esc(fb)}"` : ""} alt="" loading="lazy" draggable="false">` : ""; };
  const pic = m => m.cover || m.icon; // real photo (forum attachment) with repo icon fallback

  if (!doc.getElementById("rfm-style")) { const s = doc.createElement("style"); s.id = "rfm-style"; s.textContent = CSS; doc.head.appendChild(s); }
  const root = doc.createElement("div"); root.id = "rfm"; doc.body.appendChild(root);
  root.innerHTML = iconize(`<div class="nav"><div class="brand" data-a="home"><i>⛽</i>BeamNG <b>Marketplace</b></div>
    <div class="tabs"><span class="tab" data-a="home" data-t="home">Discover</span><span class="tab" data-a="browse" data-t="results">Browse</span><span class="tab" data-a="library" data-t="library">Mod Manager</span><span class="tab" data-a="servers" data-t="servers">BeamMP Servers</span></div>
    <div class="search">${ICON_SEARCH}<input id="rfm-q" placeholder="Search mods, maps, authors… (typos are fine)" autocomplete="off" spellcheck="false"></div>
    <span class="catp" id="rfm-cat" data-a="catpanel" title="Click for per-category progress"></span><div class="catpanel" id="rfm-catpanel" hidden></div><div class="tools" id="rfm-tools"></div><span class="classic" data-a="classic" title="Open BeamNG's original repository screen">Classic<span class="cl2"> repository</span></span><span class="chipv" id="rfm-ver">Game —</span><span class="gear" data-a="opensettings" title="Marketplace settings (accent colour, theme, Performance mode)">⚙</span><span class="close" data-a="close" title="Close (Esc)">✕</span></div>
    <div class="page" id="rfm-page"></div><div class="jpill" id="rfm-pill" hidden></div>`);
  const page = root.querySelector("#rfm-page"), qIn = root.querySelector("#rfm-q");
  root.addEventListener("load", e => { if (e.target.tagName === "IMG") e.target.classList.add("ld"); }, true);
  let badRender = null;
  root.addEventListener("error", e => { const t = e.target; if (t.tagName !== "IMG") return;
    const cur = t.getAttribute("src"); if (cur) badImg.add(cur);
    const fb = t.dataset.fb;
    if (fb && cur !== fb && !badImg.has(fb)) { t.setAttribute("src", fb); return; }
    t.style.visibility = "hidden"; t.classList.add("bad");
    // photo viewers (Mod Manager drawer, mod detail gallery): drop the broken photo from the list
    if (t.closest(".car, .gal") && !badRender) badRender = setTimeout(() => { badRender = null; render(false); }, 120); }, true);

  let heroTimer = null;
  function open(view) {
    applyPerf(); applyAccent(); if (!accentSeen()) st.welcome = true; root.classList.add("open"); call("uiOpen");
    if (typeof view === "string" && view) go(view); else render(true);
    startHero();
  }
  // silent: the router is already navigating somewhere else (e.g. the game's Back button)
  function close(silent) {
    const was = root.classList.contains("open");
    typingOff(); try { const a = doc.activeElement; if (a && root.contains(a) && a.blur) a.blur(); } catch (e) { } /* ignore */
    root.classList.remove("open"); stopHero(); stopServerRefresh(); st.confirm = null; if (was) call("uiClose");
    if (was && !silent && opts.onClose) { try { opts.onClose(); } catch (e) { console.error("Marketplace onClose", e); } }
  }
  const isOpen = () => root.classList.contains("open");
  function toggle() { root.classList.contains("open") ? close() : open(); }
  let heroVisible = true, heroIO = null;
  function watchHero() {
    try {
      if (!win.IntersectionObserver) return;
      if (!heroIO) heroIO = new win.IntersectionObserver(es => { es.forEach(e => { heroVisible = e.isIntersecting; if (e.target && e.target.classList) e.target.classList.toggle("heroOff", !heroVisible); }); }, { root: page });
      heroIO.disconnect(); const h = root.querySelector("#rfm-hero"); if (h) heroIO.observe(h);
    } catch (e) { } /* optional */
  }
  function startHero() { stopHero(); heroTimer = win.setInterval(() => { if (heroVisible && !doc.hidden && st.view === "home" && st.home && toArr(st.home.hero).length) { st.heroIdx = (st.heroIdx + 1) % st.home.hero.length; renderHeroOnly(); } }, 7000); }
  function stopHero() { if (heroTimer) win.clearInterval(heroTimer); heroTimer = null; }

  // ---- pieces ----
  const skCard = () => `<div class="skc"><div class="sk i"></div><div class="sk l"></div><div class="sk l s"></div></div>`;
  const skRail = (n = 5) => `<div class="rail">${Array.from({ length: n }, skCard).join("")}</div>`;
  const skShelf = t => `<div class="shelf"><div class="sh">${t ? `<h3>${esc(t)}</h3>` : `<div class="sk" style="width:220px;height:22px"></div>`}</div>${skRail()}</div>`;

  function subBtn(m, cls, big) {
    const d = dl.get(m.id), installed = st.installed.has(String(m.id)) || (d && d.state === "done");
    if (installed) return `<button class="btn inst-ok ${cls}" data-a="" data-id="${esc(m.id)}">✓ Installed</button>`;
    if (d && d.state === "downloading") return `<button class="btn done ${cls}" data-a="dlpanel">${Math.round((d.progress || 0) * 100)}%</button>`;
    if (d && d.state === "queued") return `<button class="btn done ${cls}" data-a="dlpanel">Queued…</button>`;
    if (d && d.state === "failed") return `<button class="btn pri ${cls}" data-a="retry" data-id="${esc(m.id)}">↻ Retry</button>`;
    if (isSub(m)) return `<button class="btn done ${cls}" data-a="" data-id="${esc(m.id)}">✓ Subscribed</button>`;
    return `<button class="btn pri ${cls}" data-a="sub" data-id="${esc(m.id)}">${big ? "Subscribe & download" : "+ Subscribe"}</button>`;
  }
  function cardProgress(m, big) {
    const d = dl.get(m.id); if (!d || (d.state !== "downloading" && d.state !== "queued")) return "";
    const w = Math.round((d.progress || 0) * 1000) / 10;
    return big ? `<div class="pbar" data-key="dpb"><i style="width:${w}%"></i></div>` : `<div class="cpb" data-key="cpb"><i style="width:${w}%"></i></div>`;
  }
  const vlive = new Set(), vreg = new Map(), vh = { c: 0, r: 0, d: 0, g: 0 };
  const VH_DEF = { c: 300, r: 52, d: 182, g: 0 };
  function vghost(kind, key, dk) {
    if (kind === "c") return `<div class="vg vg-c" data-key="${dk}" data-vk="${key}"><i style="display:block;aspect-ratio:16/9"></i><i style="display:block;height:${vh.c || 118}px"></i></div>`;
    const h = vh[kind] || VH_DEF[kind]; return `<div class="vg vg-${kind}" data-key="${dk}" data-vk="${key}"${h ? ` style="height:${h}px"` : ""}></div>`; }
  function virt(kind, dkPrefix, fn) {
    return m => {
      const key = kind + ":" + m.id, dk = dkPrefix + esc(m.id);
      vreg.set(key, () => fn(m));
      if (vlive.has(key)) return fn(m).replace(/^(\s*<div )/, `$1data-vk="${key}" `);
      return vghost(kind, key, dk);
    };
  }
  function cardRaw(m) {
    return `<div class="card" data-key="c-${esc(m.id)}" data-a="detail" data-id="${esc(m.id)}">
      <div class="cimg ph">${img(pic(m), "", m.icon)}
        <span class="badge b-${esc(m.compat)}" title="${esc(m.compatLabel)}">${esc(badgeTxt(m))}</span>
        ${m.prefix ? `<span class="pfx">${esc(m.prefix)}</span>` : ""}
        ${m.requires ? `<span class="reqb" title="This mod needs ${m.requires} other mod${m.requires > 1 ? "s" : ""} to work. Installing asks whether to add them too.">Requires ${m.requires} mod${m.requires > 1 ? "s" : ""}</span>` : ""}
        ${subBtn(m, "qsub")}${cardProgress(m)}</div>
      <div class="cbody"><div class="ct" title="${esc(m.title)}">${esc(m.title)}</div>
        <div class="ca">${esc([m.author, m.category].filter(Boolean).join(" · "))}</div>
        <div class="cu">Updated <b>${esc(m.updatedStr)}</b> · ${esc(rel(m.updated))}</div>
        <div class="cm"><span class="st" title="${(m.rating || 0).toFixed(1)}">${stars(m.rating)}</span><span class="ic">⬇ ${fmtN(m.downloads)}</span>${m.size ? `<span class="ic">${fmtSize(m.size)}</span>` : ""}</div>
      </div></div>`;
  }
  const card = virt("c", "c-", cardRaw);
  function shelf(key, title, sub, items, cat) {
    if (!items || !items.length) return "";
    return `<div class="shelf" data-key="s-${key}" data-shelf="${key}"><div class="sh"><h3>${esc(title)}</h3>${sub ? `<span class="sub">${esc(sub)}</span>` : ""}
      ${cat ? `<span class="all" data-a="seeall" data-cat="${cat}">See all ${bi("›")}</span>` : ""}</div>
      <span class="pad l" data-a="scroll" data-k="${key}" data-d="-1">${bi("‹")}</span><span class="pad r" data-a="scroll" data-k="${key}" data-d="1">${bi("›")}</span>
      <div class="rail" data-rail="${key}">${items.map(card).join("")}</div></div>`;
  }

  function heroHTML() {
    const h = st.home, list = toArr(h.hero);
    if (!list.length) return "";
    const m = list[st.heroIdx % list.length];
    return `<div class="hero" id="rfm-hero"><div class="hmain" data-a="detail" data-id="${esc(m.id)}">
        <div class="hbg" style="background-image:url('${esc(pic(m) || "")}')"></div>${img(pic(m), "himg", m.icon)}<div class="hshade"></div>
        <div class="htxt fade"><span class="eyebrow">Featured · Popular for ${esc(h.gameMajor)}</span>
          <div class="htitle">${esc(m.title)}</div>
          <div class="hmeta"><span class="badge b-${esc(m.compat)}" style="position:static">${esc(m.compatLabel)}</span>
            <span>${esc(m.author || "")}</span><span>·</span><span>${esc(m.category)}</span></div>
          ${m.tagline ? `<div class="hdesc">${esc(m.tagline)}</div>` : ""}
          <div class="hmeta"><span class="st">${stars(m.rating)}</span><span>⬇ ${fmtN(m.downloads)}</span><span>Updated <b style="color:#8ec8ff">${esc(m.updatedStr)}</b></span>${m.size ? `<span>${fmtSize(m.size)}</span>` : ""}</div>
          <div class="hcta"><button class="btn lg ${isSub(m) ? "done" : "pri"}" data-a="${isSub(m) ? "" : "sub"}" data-id="${esc(m.id)}">${isSub(m) ? "✓ Subscribed" : "Subscribe — Free"}</button>
            <button class="btn lg sec" data-a="detail" data-id="${esc(m.id)}">View details</button></div></div></div>
      <div class="hlist">${list.map((x, i) => `<div class="hli ${i === st.heroIdx % list.length ? "on" : ""}" data-a="hero" data-i="${i}">
        ${img(pic(x), "tn", x.icon)}<div class="nm">${esc(x.title)}</div><div class="bar"></div></div>`).join("")}</div></div>`;
  }
  function renderHeroOnly() {
    const el = root.querySelector("#rfm-hero"); if (!el) return;
    const tmp = doc.createElement("div"); tmp.innerHTML = iconize(heroHTML()); if (tmp.firstElementChild) morph(el, tmp.firstElementChild); markLoaded();
  }

  function topHTML() {
    const t = st.top;
    const seg = `<span class="seg">${PERIODS.map(([k, n]) => `<span class="${st.period === k ? "on" : ""}" data-a="period" data-p="${k}">${n}</span>`).join("")}</span>`;
    let body;
    if (!t) body = `<div class="rank">${Array.from({ length: 9 }, () => `<div class="ri"><div class="sk" style="width:120px;aspect-ratio:16/9"></div><div style="flex:1"><div class="sk" style="height:12px;width:70%"></div></div></div>`).join("")}</div>`;
    else if (!toArr(t.items).length) body = `<div class="empty"><b>Nothing here yet</b>No mods were updated in this period.</div>`;
    else body = (t.mode === "estimated" ? `<div class="est">⚠ <span><b>Estimated.</b> ${esc(t.info.replace(/^Estimated:\s*/, ""))}</span></div>` : `<div class="sh"><span class="sub">${esc(t.info)}</span></div>`)
      + `<div class="rank">${toArr(t.items).slice(0, 12).map((m, i) => `<div class="ri" data-a="detail" data-id="${esc(m.id)}"><div class="n">${i + 1}</div>${img(pic(m), "tn", m.icon)}
        <div style="min-width:0;flex:1"><div class="nm">${esc(m.title)}</div><div class="dl">${m.delta != null ? `<b>${t.mode === "estimated" ? "≈" : ""}+${fmtN(m.delta)}</b> · ` : ""}${fmtN(m.downloads)} total · ${esc(m.category)}</div></div>
        <span class="badge b-${esc(m.compat)}" style="position:static">${esc(badgeTxt(m))}</span></div>`).join("")}</div>`;
    return `<div class="shelf" id="rfm-top"><div class="sh"><h3>Top Downloaded</h3>${seg}</div>${body}</div>`;
  }

  function homeHTML() {
    const h = st.home;
    if (!h) {
      const off = st.hello && st.hello.online === false;
      if (off) return `<div class="empty"><b>Repository unavailable</b>${esc(st.hello.reason)}</div>`;
      return `<div class="hero"><div class="hmain sk" style="border-radius:var(--r2)"></div><div class="hlist">${Array.from({ length: 6 }, () => `<div class="hli"><div class="sk" style="width:92px;height:52px"></div><div class="sk" style="height:12px;flex:1"></div></div>`).join("")}</div></div>`
        + skShelf("Recommended for you") + skShelf("Recommended Maps") + skShelf("Recommended Cars");
    }
    if (!toArr(h.hero).length && !toArr(h.forYou).length && !toArr(h.shelves).length)
      return `<div class="empty"><b>${h.busy ? "Loading mods from the repository…" : "No mods loaded yet"}</b>${esc(h.status || "")}${h.busy ? "" : "<br><br>Check that online features are enabled and you are logged in, then reopen the Marketplace."}</div>` + topHTML();
    return heroHTML()
      + shelf("foryou", h.personalized ? "Recommended for you" : "Popular right now", h.personalized ? "Based on your mods and what you browse" : "Trending, well-rated and up to date", toArr(h.forYou))
      + topHTML()
      + (st.catalog && st.catalog.sorting ? `<div class="more" data-key="sortnote">Sorting mods into categories… ${st.catalog.sortPct || 0}% — category shelves fill in as this finishes.</div>` : "")
      + toArr(h.shelves).map(s => shelf(s.key, s.title, "", toArr(s.items), s.cat)).join("")
      + shelf("recent", "Recently Updated", "Fresh updates from authors", toArr(h.recent))
      + `<div class="foot">${esc(catText()) || h.total + " mods loaded"} · Recommendations reshuffle every few hours</div>`;
  }

  function catText() {
    const c = st.catalog; if (!c) return "";
    const f = n => Number(n || 0).toLocaleString("en-US");
    if (c.sorting && c.loaded) return `Sorting mods into categories… ${c.sortPct || 0}%`;
    const src = c.source === "snapshot" ? " · from snapshot" : "";
    return c.done ? `Catalog: ${f(c.loaded)} mods${src}` : `Catalog: ${f(c.loaded)} / ~${f(c.total)} mods${src}${c.paused ? " (paused)" : ""}`;
  }
  function moreHTML(r) {
    const shown = toArr(r.items).length;
    if (shown < r.total) return `<div class="more" data-key="more"><button class="btn sec" data-a="more">Show more (${(r.total - shown).toLocaleString("en-US")} left)</button></div>`;
    if (r.serverMore && st.q) return `<div class="more" data-key="more">${st.loadingMore ? "Searching the server for more…" : `<button class="btn sec" data-a="more">Search the server for more</button>`}</div>`;
    return `<div class="more" data-key="more">That's everything${st.catalog && !st.catalog.done ? " loaded so far — the catalog is still filling in" : ""}.</div>`;
  }
  const fchip = (k, v, n) => `<span class="chip ${String(st.f[k]) === String(v) ? "on" : ""}" data-a="fset" data-k="${k}" data-v="${esc(v)}">${n}</span>`;
  const mchip = (k, v, n) => `<span class="chip ${st.f[k].includes(v) ? "on" : ""}" data-a="fmulti" data-k="${k}" data-v="${esc(v)}">${n}</span>`;
  const ftog = (k, n) => `<div class="tog ${st.f[k] ? "on" : ""}" data-a="ftog" data-k="${k}">${n}<i></i></div>`;
  // active-filter chips: [label, clear-action]
  function activeFilters() {
    const f = st.f, out = [], lbl = (arr, v) => (arr.find(x => String(x[0]) === String(v)) || [0, v])[1];
    const cats = toArr(st.hello && st.hello.categories);
    st.cats.forEach(c => out.push([(cats.find(x => x.id === c) || { name: "Category " + c }).name, "cat:" + c]));
    if (f.updatedWithin) out.push(["Updated: " + lbl(WITHIN, f.updatedWithin), "updatedWithin"]);
    f.statuses.forEach(v => out.push([v, "statuses:" + v]));
    f.vehicleTypes.forEach(v => out.push([lbl(VTYPES, v), "vehicleTypes:" + v]));
    if (f.minDownloads) out.push([lbl(MINDL, f.minDownloads) + " downloads", "minDownloads"]);
    if (f.minRating) out.push([f.minRating + "★ & up", "minRating"]);
    if (f.minSizeMB !== "" || f.maxSizeMB !== "") out.push([`Size ${f.minSizeMB || 0}–${f.maxSizeMB || "∞"} MB`, "size"]);
    if (f.author) out.push(["Author: " + f.author, "author"]);
    if (f.hideSubscribed) out.push(["Not installed", "hideSubscribed"]);
    if (f.hasPhotos) out.push(["Has photos", "hasPhotos"]);
    if (st.onlyCurrent) out.push(["For my version", "onlyCurrent"]);
    if (st.hideUnstable) out.push(["No Alpha/Beta/WIP", "hideUnstable"]);
    return out;
  }
  function activeHTML() {
    const a = activeFilters(); if (!a.length) return "";
    return `<div class="active" data-key="active">${a.map(([l, k]) => `<span class="achip">${esc(l)}<b data-a="unf" data-k="${esc(k)}" title="Remove">×</b></span>`).join("")}<span class="clrall" data-a="clearall">Clear all</span></div>`;
  }
  function clearFilter(k) {
    const [name, v] = k.split(":");
    if (name === "cat") st.cats.delete(+v);
    else if (name === "statuses" || name === "vehicleTypes") st.f[name] = st.f[name].filter(x => x !== v);
    else if (name === "size") { st.f.minSizeMB = ""; st.f.maxSizeMB = ""; }
    else if (name === "onlyCurrent" || name === "hideUnstable") st[name] = false;
    else st.f[name] = defaultFilters()[name];
  }
  const CAT_ICON = { 3: "🚗", 4: "✈️", 5: "📦", 6: "🚤", 14: "⚙️", 8: "🎬", 9: "🗺️", 10: "🖥️", 13: "🔊", 15: "🔢", 7: "🧩", 12: "🎨" };
  const VIEWS = [["grid", "Grid", '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>'],
    ["compact", "Compact list", '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.2" rx="1"/><rect x="1" y="6.9" width="14" height="2.2" rx="1"/><rect x="1" y="11.8" width="14" height="2.2" rx="1"/></svg>'],
    ["detailed", "Detailed list", '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1.5" width="5" height="5" rx="1"/><rect x="7.5" y="2" width="7.5" height="1.6" rx=".8"/><rect x="7.5" y="4.6" width="5" height="1.4" rx=".7"/><rect x="1" y="9.5" width="5" height="5" rx="1"/><rect x="7.5" y="10" width="7.5" height="1.6" rx=".8"/><rect x="7.5" y="12.6" width="5" height="1.4" rx=".7"/></svg>'],
    ["gallery", "Gallery", '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="8" rx="1.5"/><rect x="1" y="10.5" width="6.5" height="4.5" rx="1.2"/><rect x="8.5" y="10.5" width="6.5" height="4.5" rx="1.2"/></svg>']];
  const compatCls = m => "b-" + esc(m.compat);
  function rowPb(m) { const d = dl.get(m.id); if (!d || (d.state !== "downloading" && d.state !== "queued")) return ""; return `<div class="rowpb" data-key="rpb"><i style="width:${Math.round((d.progress || 0) * 1000) / 10}%"></i></div>`; }
  function rowCompactRaw(m) {
    return `<div class="crow" data-key="r-${esc(m.id)}" data-a="detail" data-id="${esc(m.id)}"><div class="th ph">${img(m.icon || pic(m), "", "")}</div>
      <div class="tt"><b title="${esc(m.title)}">${esc(m.title)}</b><span>${esc(m.author || "")}${m.category ? " · " + esc(m.category) : ""} · updated ${esc(m.updatedStr || "?")}</span></div>
      <div class="v"><span class="bdg badge ${compatCls(m)}" style="position:static" title="${esc(m.compatLabel)}">${esc(badgeTxt(m))}</span></div>
      <div class="v">${m.size ? fmtSize(m.size) : "—"}</div><div class="v">⬇ ${fmtN(m.downloads)}</div><div class="v st">${stars(m.rating)}</div>
      <div>${subBtn(m, "qsub")}</div>${rowPb(m)}</div>`;
  }
  function rowDetailedRaw(m) {
    const ex = m.tagline || "";
    return `<div class="cdet" data-key="d-${esc(m.id)}" data-a="detail" data-id="${esc(m.id)}"><div class="th ph">${img(pic(m), "", m.icon)}
        ${m.prefix ? `<span class="pfx">${esc(m.prefix)}</span>` : ""}${cardProgress(m)}</div>
      <div class="bd"><h3 title="${esc(m.title)}">${esc(m.title)}</h3><div class="ca">by <b style="color:var(--tx)">${esc(m.author || "unknown")}</b>${m.version ? " · v" + esc(m.version) : ""}</div>
        ${ex ? `<div class="ex">${esc(ex)}</div>` : ""}
        <div class="tg">${m.category ? `<span>${CAT_ICON[(toArr(st.hello && st.hello.categories).find(c => c.name === m.category) || {}).id] || "📁"} ${esc(m.category)}</span>` : ""}${m.prefix ? `<span>${esc(m.prefix)}</span>` : ""}${m.requires ? `<span>Requires ${m.requires} mod${m.requires > 1 ? "s" : ""}</span>` : ""}</div>
        <div class="cm"><span class="st">${stars(m.rating)}</span><span>${(m.rating || 0).toFixed(1)}</span><span class="ic">⬇ ${fmtN(m.downloads)}</span>${m.size ? `<span class="ic">${fmtSize(m.size)}</span>` : ""}</div></div>
      <div class="sx"><span class="bdg badge ${compatCls(m)}" style="position:static;align-self:flex-start" title="${esc(m.compatLabel)}">${esc(m.compatLabel || badgeTxt(m))}</span>
        <div class="cu">Updated <b>${esc(m.updatedStr)}</b><br>${esc(rel(m.updated))}</div>${subBtn(m, "qsub")}</div></div>`;
  }
  function tileGalleryRaw(m) {
    return `<div class="gtile" data-key="g-${esc(m.id)}" data-a="detail" data-id="${esc(m.id)}">${img(pic(m), "", m.icon)}
      <span class="badge ${compatCls(m)}" title="${esc(m.compatLabel)}">${esc(badgeTxt(m))}</span>${subBtn(m, "qsub")}${cardProgress(m)}
      <div class="ov"><b>${esc(m.title)}</b><span>${esc(m.author || "")} · ⬇ ${fmtN(m.downloads)} · ${(m.rating || 0).toFixed(1)}★</span><span class="gup">Updated ${esc(m.updatedStr || "?")} · ${esc(rel(m.updated))}</span></div></div>`;
  }
  const rowCompact = virt("r", "r-", rowCompactRaw), rowDetailed = virt("d", "d-", rowDetailedRaw), tileGallery = virt("g", "g-", tileGalleryRaw);
  function resultsHTML(items) {
    const v = st.bview;
    if (v === "compact") return `<div class="cl rv" data-key="v-compact">${items.map(rowCompact).join("")}</div>`;
    if (v === "detailed") return `<div class="dl2 rv" data-key="v-detailed">${items.map(rowDetailed).join("")}</div>`;
    if (v === "gallery") return `<div class="gal2 rv" data-key="v-gallery">${items.map(tileGallery).join("")}</div>`;
    return `<div class="grid rv" data-key="v-grid">${items.map(card).join("")}</div>`;
  }
  function skeletonHTML() {
    const v = st.bview, n = v === "compact" ? 14 : v === "detailed" ? 5 : v === "gallery" ? 6 : 12;
    if (v === "grid") return `<div class="grid">${Array.from({ length: n }, skCard).join("")}</div>`;
    const cls = v === "compact" ? "cl" : v === "detailed" ? "dl2" : "gal2", sk = v === "compact" ? "skr" : v === "detailed" ? "skd" : "skg";
    return `<div class="${cls}">${Array.from({ length: n }, () => `<div class="sk ${sk}"></div>`).join("")}</div>`;
  }
  const CHEV = '<svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>';
  function fsec(key, title, body, badge) {
    return `<div class="fs ${st.fclosed.has(key) ? "closed" : ""}" data-key="fs-${key}"><div class="fsh" data-a="fsec" data-k="${key}" tabindex="0">${esc(title)}${badge ? `<span class="badge2">${esc(badge)}</span>` : ""}${CHEV}</div><div class="fsb">${body}</div></div>`;
  }
  const ck = (on, a, k, v, label, rad, n) => `<div class="ck ${rad ? "rad" : ""} ${on ? "on" : ""}" data-a="${a}" data-k="${k}"${v != null ? ` data-v="${esc(v)}"` : ""} tabindex="0"><i></i><span>${label}</span>${n != null ? `<span class="n">${n}</span>` : ""}</div>`;
  const SIZE_STEPS = [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000];
  function sizeIdx(v, dflt) { if (v === "" || v == null) return dflt; let i = 0; for (let j = 0; j < SIZE_STEPS.length; j++) if (SIZE_STEPS[j] <= +v) i = j; return i; }
  const pct = (i, n) => (i / (n - 1) * 100).toFixed(1) + "%";
  function filtersHTML() {
    const cats = toArr(st.hello && st.hello.categories), f = st.f, nAct = activeFilters().length;
    const tog = (k, label) => `<div class="tog ${st[k] ? "on" : ""}" data-a="tog" data-k="${k}" tabindex="0">${label}<i></i></div>`;
    const counts = {}; for (const m of toArr(st.results && st.results.items)) counts[m.category] = (counts[m.category] || 0) + 1;
    const dlI = Math.max(0, MINDL.findIndex(x => x[0] === +f.minDownloads)), loI = sizeIdx(f.minSizeMB, 0), hiI = sizeIdx(f.maxSizeMB, SIZE_STEPS.length - 1);
    const r = +f.minRating || 0;
    return `<aside class="side fx"><div class="fxh"><h4>Filters${nAct ? `<span class="cnt">${nAct}</span>` : ""}</h4>${nAct ? `<span class="clr" data-a="clearall">Clear all</span>` : ""}</div>
      ${fsec("sort", "Sort by", `<div class="sortl">${SORTS.map(([k, n]) => `<span class="${st.sort === k ? "on" : ""}" data-a="sort" data-s="${k}">${n}</span>`).join("")}</div>`)}
      ${fsec("compat", "Compatibility", tog("onlyCurrent", "Updated for my version") + tog("hideOutdated", "Hide older mods") + tog("hideUnstable", "Hide Alpha / Beta / WIP"))}
      ${fsec("cats", "Categories", `<div class="cgrid">${cats.map(c => `<div class="cchip ${st.cats.has(c.id) ? "on" : ""}" data-a="cat" data-c="${c.id}" title="${esc(c.name)}" tabindex="0"><span class="e">${CAT_ICON[c.id] || "📁"}</span><span class="t">${esc(c.name)}</span>${counts[c.name] ? `<span class="n">${fmtN(counts[c.name])}</span>` : ""}</div>`).join("")}</div>
        ${st.cats.size ? `<span class="clrall" style="align-self:flex-start;margin:6px 0 0" data-a="clearcats">Clear categories</span>` : ""}`, st.cats.size ? String(st.cats.size) : "")}
      ${fsec("rating", "Rating", `<div class="stars">${[1, 2, 3, 4, 5].map(i => `<span class="${r >= i ? "on" : ""}" data-a="fset" data-k="minRating" data-v="${i}" title="${i}★ and up">★</span>`).join("")}<em data-a="fset" data-k="minRating" data-v="0">${r ? r + "★ & up · clear" : "Any"}</em></div>`, r ? r + "★+" : "")}
      ${fsec("dl", "Downloads", `<div class="rs"><div class="rl"><span>Minimum</span><b data-rl="dl">${MINDL[dlI][1]}</b></div>
        <input type="range" class="rg" min="0" max="${MINDL.length - 1}" step="1" value="${dlI}" data-rs="dl" style="--p:${pct(dlI, MINDL.length)}"></div>`, f.minDownloads ? MINDL[dlI][1] : "")}
      ${fsec("size", "File size", `<div class="rs"><div class="rl"><span>Min</span><b data-rl="lo">${SIZE_STEPS[loI]} MB</b></div>
        <input type="range" class="rg" min="0" max="${SIZE_STEPS.length - 1}" step="1" value="${loI}" data-rs="lo" style="--p:${pct(loI, SIZE_STEPS.length)}">
        <div class="rl"><span>Max</span><b data-rl="hi">${hiI === SIZE_STEPS.length - 1 ? "No limit" : SIZE_STEPS[hiI] + " MB"}</b></div>
        <input type="range" class="rg" min="0" max="${SIZE_STEPS.length - 1}" step="1" value="${hiI}" data-rs="hi" style="--p:${pct(hiI, SIZE_STEPS.length)}">
        <div class="rng"><input class="fi" data-f="minSizeMB" type="number" min="0" placeholder="min MB" value="${esc(f.minSizeMB)}"> – <input class="fi" data-f="maxSizeMB" type="number" min="0" placeholder="max MB" value="${esc(f.maxSizeMB)}"></div></div>`,
        f.minSizeMB !== "" || f.maxSizeMB !== "" ? "on" : "")}
      ${fsec("upd", "Updated within", WITHIN.map(([k, n]) => ck(String(f.updatedWithin) === String(k), "fset", "updatedWithin", k, n, true)).join(""), f.updatedWithin ? (WITHIN.find(x => x[0] === f.updatedWithin) || [0, ""])[1] : "")}
      ${fsec("status", "Release status", STATUSES.map(k => ck(f.statuses.includes(k), "fmulti", "statuses", k, k)).join(""), f.statuses.length ? String(f.statuses.length) : "")}
      ${fsec("vtype", "Vehicle type (Land)", VTYPES.map(([k, n]) => ck(f.vehicleTypes.includes(k), "fmulti", "vehicleTypes", k, n)).join(""), f.vehicleTypes.length ? String(f.vehicleTypes.length) : "")}
      ${fsec("author", "Author", `<input class="fi" data-f="author" placeholder="Any author" autocomplete="off" value="${esc(f.author)}">
        ${st.authors && f.author && toArr(st.authors.items).length && !toArr(st.authors.items).some(a => a.name === f.author) ? `<div class="ac">${toArr(st.authors.items).map(a => `<div data-a="author" data-n="${esc(a.name)}"><span>${esc(a.name)}</span><span>${a.count}</span></div>`).join("")}</div>` : ""}`, f.author ? "1" : "")}
      ${fsec("more", "More", ck(f.hideSubscribed, "ftog", "hideSubscribed", null, "Hide installed / subscribed") + ck(f.hasPhotos, "ftog", "hasPhotos", null, "Has photos"))}
    </aside>`;
  }
  function browseHTML() {
    const r = st.results;
    const items = r ? toArr(r.items) : [];
    const grid = !r ? skeletonHTML()
      : items.length ? `${resultsHTML(items)}${moreHTML(r)}`
      : st.cats.size && st.catalog && st.catalog.sorting
        ? `<div class="empty" data-key="sorting"><b>Sorting mods into categories… ${st.catalog.sortPct || 0}%</b>The repository list doesn't say which category a mod is in, so Marketplace is sorting the catalog in the background. Results appear here as it goes.</div>`
        : `<div class="empty"><b>No mods found</b>${r.busy ? "Still asking the server…" : "Try fewer words or different filters."}</div>`;
    const vsw = `<span class="vsw" data-key="vsw">${VIEWS.map(([k, n, ic], i) => `<span class="${st.bview === k ? "on" : ""}" data-a="bview" data-k="${k}" title="${n} (${i + 1})">${ic}</span>`).join("")}</span>`;
    return `<div class="browse">${filtersHTML()}<section><div class="rhead"><h2>${st.q ? `Results for “${esc(st.q)}”` : "Browse mods"}</h2>
      <span>${r ? `${Number(r.total).toLocaleString("en-US")} found${r.busy ? " · searching the server…" : ""}` : ""}</span><span class="catp" style="margin-left:auto">${esc(catText())}</span>${vsw}</div>${activeHTML()}${grid}</section></div>`;
  }

  const stripBB = s => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/\[img[^\]]*\][^[]*\[\/img\]/gi, "")
    .replace(/\[\/?[a-z*]+(=[^\]]*)?\]/gi, "").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();

  function detailHTML() {
    const d = st.detail;
    if (!d) return `<div class="dhero sk"></div><div class="dgrid"><div class="sk" style="aspect-ratio:16/9;border-radius:var(--r2)"></div><div class="sk" style="height:320px;border-radius:var(--r2)"></div></div>`;
    if (d.removed) return `<div class="empty" data-key="removed"><b>This mod was removed from the repository</b>
      ${esc((d.item && d.item.title) || "")} is no longer available on beamng.com, so it has been taken out of the catalog.<br><br>
      <button class="btn sec" data-a="back">${bi("‹")} Back</button></div>`;
    const m = d.item, real = toArr(d.images).filter(u => u && !badImg.has(u)), shots = real.length ? real : [m.icon].filter(u => u && !badImg.has(u)),
      cur = shots[st.shot % Math.max(1, shots.length)];
    return `<div class="dhero"><div class="hbg" style="background-image:url('${esc(real[0] || pic(m) || "")}')"></div><div class="hshade"></div>
        <button class="btn sec back" data-a="back">${bi("‹")} Back</button>
        <div class="dhead fade"><span class="eyebrow">${esc(m.category)}${m.prefix ? " · " + esc(m.prefix) : ""}</span><div class="dtitle">${esc(m.title)}</div>
          <div class="hmeta"><span>by <b style="color:var(--tx)">${esc(m.author || "unknown")}</b></span><span class="st">${stars(m.rating)}</span><span>${(m.rating || 0).toFixed(1)}${m.ratingCount ? ` (${m.ratingCount})` : ""}</span></div></div></div>
      <div class="dgrid"><div class="gal">${cur ? `<img class="im main" data-key="main-${esc(cur)}" src="${esc(cur)}"${m.icon && cur !== m.icon && !badImg.has(m.icon) ? ` data-fb="${esc(m.icon)}"` : ""} alt="">` : `<div class="main ph"></div>`}
          ${shots.length > 1 ? `<div class="strip">${shots.map((u, i) => `<img class="im ${i === st.shot % shots.length ? "on" : ""}" src="${esc(u)}" data-a="shot" data-i="${i}" alt="" loading="lazy">`).join("")}</div>` : ""}
          <div class="phnote">${real.length ? `${real.length} photo${real.length > 1 ? "s" : ""} from the mod page` : d.partial ? "Loading photos…" : "No photos published for this mod"}</div>
          ${toArr(d.requirements).length ? `<div class="descb reqs" data-key="reqs"><h4>Requirements</h4><div class="phnote">This mod needs these mods to work.</div>${toArr(d.requirements).map(r => `<div class="hm">${r.installed ? "✓" : "○"} ${r.tagid ? `<span class="clrall" data-a="detail" data-id="${esc(r.tagid)}">${esc(r.title || r.tagid)}</span>` : `<span class="clrall" data-a="reqweb" data-v="${esc(r.resourceId)}" title="Open on beamng.com">${esc(r.title || "Resource #" + r.resourceId)}</span>`}
            <span class="phnote">${r.installed ? "installed" : r.tagid ? (r.size ? fmtSize(r.size) + " · " : "") + "not installed" : "not installed · open the page to get it"}</span></div>`).join("")}</div>` : ""}
          <div class="descb"><h4>About this mod</h4>${esc(stripBB(d.message || m.tagline || (d.partial ? "Loading description…" : "No description.")))}</div></div>
        <aside class="panel"><span class="badge b-${esc(m.compat)}" style="position:static;align-self:flex-start;font-size:12px;padding:6px 10px">${esc(m.compatLabel)}</span>
          <div class="upbig">Last updated<b>${esc(m.updatedStr)}</b><span>${esc(rel(m.updated))}</span></div>
          ${(() => { const miss = toArr(d.requirements).filter(r => !r.installed); return miss.length && !st.installed.has(String(m.id)) ? `<div class="alsoi" data-key="alsoi">Also installs: <b>${miss.map(r => esc(r.title || "resource #" + r.resourceId)).join(", ")}</b><span>You'll be asked first.</span></div>` : ""; })()}
          ${subBtn(m, "lg", true)}${cardProgress(m, true)}
          <button class="btn sec" data-a="official" data-id="${esc(m.id)}">Open in official repository</button>
          <div class="kv"><span>Downloads</span><b>${(m.downloads || 0).toLocaleString("en-US")}</b></div>
          ${m.size ? `<div class="kv"><span>Size</span><b>${fmtSize(m.size)}</b></div>` : ""}
          ${m.version ? `<div class="kv"><span>Mod version</span><b>${esc(m.version)}</b></div>` : ""}
          <div class="kv"><span>Category</span><b>${esc(m.category)}</b></div>
          <div class="kv" style="border:0"><span>Your game</span><b>${esc((st.hello && st.hello.gameMajor) || "?")}</b></div></aside></div>`;
  }

  function saveRails() { root.querySelectorAll("[data-rail]").forEach(r => { st.rails[r.dataset.rail] = r.scrollLeft; }); }
  function restoreRails() { root.querySelectorAll("[data-rail]").forEach(r => { if (st.rails[r.dataset.rail]) r.scrollLeft = st.rails[r.dataset.rail]; }); updatePads(); }
  // hide the left arrow at the start and the right arrow at the end of each shelf (4 px tolerance)
  const PAD_TOL = 4;
  function padState(r) { const max = r.scrollWidth - r.clientWidth; return { start: r.scrollLeft <= PAD_TOL, end: max <= PAD_TOL || r.scrollLeft >= max - PAD_TOL }; }
  function updatePads(only) {
    (only ? [only] : root.querySelectorAll("[data-rail]")).forEach(r => {
      const sh = r.closest(".shelf"); if (!sh) return;
      const s2 = padState(r), l = sh.querySelector(".pad.l"), rt = sh.querySelector(".pad.r");
      if (l) { l.classList.toggle("off", s2.start); l.setAttribute("aria-disabled", s2.start); }
      if (rt) { rt.classList.toggle("off", s2.end); rt.setAttribute("aria-disabled", s2.end); }
    });
  }
  let padRaf = 0;
  const padsSoon = () => { if (padRaf) return; padRaf = (win.requestAnimationFrame || setTimeout)(() => { padRaf = 0; updatePads(); }); };
  // ---- Mod Manager ----
  const lib = { data: null, health: null, page: "dash", side: true, q: "", sort: "name", view: "list", tour: null, stack: true, cats: new Set(), author: "",
    tags: new Set(), support: false, filters: false, sel: new Set(), drawer: null, shot: 0, edit: null, msg: null, notes: [], bell: false, unread: 0,
    upd: { queue: null, checking: false, checked: 0, last: "", run: null, log: {} }, keep: 1, cmp: null, loEdit: null, loName: "", loDesc: "", loAlways: false, pack: null, packFiles: null, packExport: null,
    importText: "", exportText: null, exportPath: null, files: [], backupText: null, backupPath: null, backups: [], restoreText: "", loCheck: null,
    tagEdit: null, missing: null, healthAsked: false, dragId: null, planNames: null };
  const mp = { data: null, raw: null, src: "lua", q: "", country: "", map: "", free: false, tag: "", maxMB: "", sort: "players", dir: -1,
    show: "all", detail: null, limit: 150, timer: null, fetchTried: false, err: null, fetchErr: null, failT: null, prefs: {} };
  st.lib = lib; st.mp = mp; st.confirm = null;
  const libCall = (fn, ...a) => lua(`extensions.load("marketplaceModLib"); extensions.marketplaceModLib.${fn}(${a.map(toLua).join(",")})`);
  const mpCall = (fn, ...a) => lua(`extensions.load("marketplaceModMP"); extensions.marketplaceModMP.${fn}(${a.map(toLua).join(",")})`);
  const MB = b => (b / 1048576);
  const fmtBytes = b => !b ? "0 MB" : b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB" : MB(b).toFixed(b < 10485760 ? 1 : 0) + " MB";
  const SUGGESTED_TAGS = ["Cars", "Trucks", "Aircraft", "Drift", "Maps", "Racing", "Offroad"];
  // themes; the first one is the default
  const THEMES = {
    "dark-orange": { name: "BeamNG", v: { bg: "rgba(var(--bng-off-black-rgb, 15, 15, 15), .82)", s1: "var(--bng-cool-gray-900, #151820)", s2: "var(--bng-cool-gray-850, #1f222a)",
      s3: "var(--bng-cool-gray-800, #282b33)", line: "rgba(255, 255, 255, .1)", tx: "var(--bng-off-white, #ebebeb)", tx2: "var(--bng-cool-gray-200, #b6bdcf)", tx3: "var(--bng-cool-gray-400, #979dad)",
      hd: "rgba(0, 0, 0, .25)", pn: "rgba(var(--bng-off-black-rgb, 15, 15, 15), .6)", pnh: "rgba(var(--bng-off-black-rgb, 15, 15, 15), .95)", pp: "var(--bng-cool-gray-800, #282b33)",
      pm: "var(--bng-cool-gray-700, #424651)", pl: "var(--bng-ter-blue-gray-700, #2b475d)", plh: "var(--bng-ter-blue-gray-500, #6a8ba1)",
      in: "var(--bng-cool-gray-900, #151820)", inl: "var(--bng-cool-gray-500, #808696)", inf: "var(--bng-cool-gray-850, #1f222a)",
      b2: "var(--bng-ter-blue-gray-700, #2b475d)", b2h: "var(--bng-ter-blue-gray-600, #4a697e)", b2a: "var(--bng-ter-blue-gray-800, #172d40)",
      acc: "#ff6600", acc2: "#ff8955", acc3: "#a54106", accb: "#da5706" } },
    "midnight-blue": { name: "Midnight Blue", v: { bg: "#0b1020", s1: "#121a2e", s2: "#18223a", s3: "#223050", line: "#26324d", tx: "#eef2ff", tx2: "#a5b0cc", tx3: "#6a7594", acc: "#2f7bff", acc2: "#5b9bff" } },
    "forest": { name: "Forest", v: { bg: "#0c120e", s1: "#131c16", s2: "#19251d", s3: "#233328", line: "#26362b", tx: "#eef6f0", tx2: "#a6b8ab", tx3: "#6b7d70", acc: "#1fae5b", acc2: "#3ecf6e" } },
    "purple-haze": { name: "Purple Haze", v: { bg: "#100c18", s1: "#181224", s2: "#20182f", s3: "#2c2140", line: "#302545", tx: "#f4f0ff", tx2: "#b3a8c9", tx3: "#776c8e", acc: "#8a4dff", acc2: "#a879ff" } },
    "crimson": { name: "Crimson", v: { bg: "#120c0c", s1: "#1c1313", s2: "#251919", s3: "#332222", line: "#3a2626", tx: "#fff1f1", tx2: "#c4a9a9", tx3: "#8a6d6d", acc: "#e5383b", acc2: "#ff5d52" } },
    "steel": { name: "Steel", v: { bg: "#111315", s1: "#1a1d20", s2: "#22262a", s3: "#2e3338", line: "#33393f", tx: "#f1f3f5", tx2: "#a9b1b9", tx3: "#6e767e", acc: "#14b8c4", acc2: "#3fd3dc" } },
    "light": { name: "Light", v: { bg: "#f2f3f5", s1: "#ffffff", s2: "#f7f7f9", s3: "#e4e6ea", line: "#d9dce1", tx: "#16181c", tx2: "#4a505a", tx3: "#7b828d", acc: "#ff6600", acc2: "#ff8955", acc3: "#a54106", accb: "#da5706" } },
  };
  // every variable any theme sets (cleared before a theme is applied, so nothing leaks between themes)
  const THEME_KEYS = [...new Set(Object.values(THEMES).flatMap(t => Object.keys(t.v)).concat(["acc3", "accb"]))];
  const ACCENTS = { orange: ["Orange", "#ff6600", "#ff8955", "#a54106", "#da5706"], blue: ["Blue", "#2f7bff", "#5b9bff"], teal: ["Teal", "#14b8c4", "#3fd3dc"], green: ["Green", "#1fae5b", "#3ecf6e"],
    purple: ["Purple", "#8a4dff", "#a879ff"], pink: ["Pink", "#e83e8c", "#ff6aa9"], red: ["Red", "#e5383b", "#ff5d52"], yellow: ["Yellow", "#e0a800", "#ffc83d"] };
  const ACC_KEY = "marketplaceMod.accent.v1", ACC_SEEN = "marketplaceMod.accentChosen.v1";
  const lighten = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * f)); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); };
  const darken = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * (1 - f))); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); };
  const OLD_ORANGE = /^#f26a00$/i;
  function accentVal() { try { const s0 = store(); let v = s0 && s0.getItem(ACC_KEY);
    if (v && OLD_ORANGE.test(v)) { v = "orange"; s0.setItem(ACC_KEY, v); }
    if (v && (ACCENTS[v] || /^#[0-9a-f]{6}$/i.test(v))) return v; } catch (e) { } return ""; } /* ignore */
  // [accent, hover/highlight, pressed, button rest]
  function accentPair(v) { if (ACCENTS[v]) return [ACCENTS[v][1], ACCENTS[v][2], ACCENTS[v][3] || darken(ACCENTS[v][1], .35), ACCENTS[v][4] || darken(ACCENTS[v][1], .15)];
    if (/^#[0-9a-f]{6}$/i.test(v || "")) return [v, lighten(v, .25), darken(v, .35), darken(v, .15)]; return null; }
  function setAccent(v) { try { const s0 = store(); if (s0) { if (v) s0.setItem(ACC_KEY, v); else s0.removeItem(ACC_KEY); } } catch (e) { } applyAccent(); } /* ignore */
  function accentSeen() { try { const s0 = store(); return !!(s0 && s0.getItem(ACC_SEEN)); } catch (e) { return true; } }
  function markAccentSeen() { try { const s0 = store(); if (s0) s0.setItem(ACC_SEEN, "1"); } catch (e) { } } /* ignore */
  function swatchesHTML(cur) {
    return `<div class="accs">${Object.entries(ACCENTS).map(([k, a]) => `<span class="acsw ${cur === k || (!cur && k === "orange") ? "on" : ""}" data-a="accpick" data-v="${k}" title="${a[0]}" style="--sw:${a[1]}"><i></i><b>${a[0]}</b></span>`).join("")}
      <label class="acsw cust ${/^#/.test(cur || "") ? "on" : ""}" title="Custom colour" style="--sw:${/^#/.test(cur || "") ? cur : "#888888"}"><i></i><b>Custom</b><input type="color" data-acc="custom" value="${/^#/.test(cur || "") ? cur : ACCENTS.orange[1]}"></label></div>`;
  }
  const SUPPORT_NAMES = { patreon: "Patreon", "ko-fi": "Ko-fi", buymeacoffee: "Buy Me a Coffee", gumroad: "Gumroad", boosty: "Boosty" };
  // notifications (last 50, kept in localStorage)
  try { const s = store(); const v = s && JSON.parse(s.getItem("marketplaceMod.notes") || "[]"); if (Array.isArray(v)) lib.notes = v.slice(0, 50); } catch (e) { } /* ignore */
  function notify(type, msg) {
    if (!msg) return;
    lib.notes.unshift({ type: type || "info", msg: String(msg), t: Math.floor(Date.now() / 1000) }); lib.notes.length = Math.min(lib.notes.length, 50); lib.unread++;
    try { const s = store(); if (s) s.setItem("marketplaceMod.notes", JSON.stringify(lib.notes)); } catch (e) { } /* ignore */
  }
  function themeKey() { const s = (lib.data && lib.data.settings) || {}; return THEMES[s.theme] ? s.theme : "dark-orange"; }
  function applyAccent() {
    if (!root.style) return;
    const t = THEMES[themeKey()];
    for (const k of THEME_KEYS) if (!(k in t.v)) root.style.removeProperty("--" + k);
    for (const k in t.v) root.style.setProperty("--" + k, t.v[k]);
    root.style.setProperty("--acc3", t.v.acc3 || darken(t.v.acc, .35)); root.style.setProperty("--accb", t.v.accb || darken(t.v.acc, .15));
    const ap = accentPair(accentVal()); if (ap) { root.style.setProperty("--acc", ap[0]); root.style.setProperty("--acc2", ap[1]); root.style.setProperty("--acc3", ap[2]); root.style.setProperty("--accb", ap[3]); }
    root.classList.toggle("light", themeKey() === "light");
  }

  const mods = () => toArr(lib.data && lib.data.mods);
  const T = r => r.ctitle || r.title || r.name;
  const A = r => r.cauthor || r.author || "";
  const byName = n => mods().find(x => x.name === n);
  const modTitle = n => { const r = byName(n); return r ? T(r) : n; };
  const byRes = () => { const m = new Map(); for (const r of mods()) if (r.resourceId != null) m.set(+r.resourceId, r); return m; };
  const notDep = (n, id) => { const d = (lib.data && lib.data.notDeps || {})[n]; return !!(d && (d[id] || d[String(id)])); };
  const recentCut = () => Date.now() / 1000 - 14 * 86400;
  const upEntries = () => toArr(lib.upd.queue && lib.upd.queue.updatingList);
  // updates the user wants: waiting, not ignored, never a downgrade (mirror of marketplaceModLibCore.updatable)
  function updatable() {
    const ign = (lib.data && lib.data.ignoreUpd) || {}, best = new Map();
    for (const r of mods()) if (r.tagid && (!best.has(r.tagid) || (r.verId || 0) > (best.get(r.tagid).verId || 0))) best.set(r.tagid, r);
    return upEntries().filter(e => e.id && !ign[e.id] && e.state !== "done" && !(best.get(e.id) && best.get(e.id).verId && +e.ver && +e.ver <= best.get(e.id).verId));
  }
  const updIds = () => new Set(updatable().map(e => String(e.id)));
  // requirement problems among active mods (respecting 'Not a requirement')
  function depProblems() {
    const res = byRes(), out = [];
    for (const r of mods()) if (r.active) for (const id of toArr(r.reqIds)) {
      if (+id === +r.resourceId || notDep(r.name, id)) continue;
      const m = res.get(+id);
      if (!m) out.push({ mod: r.name, id, status: "missing" }); else if (!m.active) out.push({ mod: r.name, id, status: "inactive", name: m.name });
    }
    return out;
  }
  function counts() {
    const h = lib.health || {}, all = mods();
    const dp = depProblems();
    return { all: all.length, active: all.filter(r => r.active).length, inactive: all.filter(r => !r.active).length,
      fav: all.filter(r => (lib.data.fav || {})[r.name]).length, recent: all.filter(r => (r.activeAt || 0) > recentCut()).length,
      updates: updatable().length, duplicates: toArr(h.duplicates).length, conflicts: toArr(h.conflicts).length,
      deps: new Set(dp.map(x => x.mod)).size, broken: toArr(lib.data.broken).length };
  }

  // ---- library rows ----
  function libRows() {
    const d = lib.data; if (!d) return [];
    const tags = d.tags || {}, fav = d.fav || {}, q = lib.q.trim().toLowerCase(), pg = lib.page;
    let lo = null;
    if (pg.startsWith("lo:")) lo = toArr(d.loadouts).find(x => x.id === pg.slice(3));
    const loKeys = lo ? new Set(toArr(lo.mods)) : null;
    let rows = mods().filter(r => {
      if (pg === "active" && !r.active) return false;
      if (pg === "inactive" && r.active) return false;
      if (pg === "fav" && !fav[r.name]) return false;
      if (pg === "recent" && !((r.activeAt || 0) > recentCut())) return false;
      if (loKeys && !loKeys.has(r.key) && !loKeys.has("n:" + r.name)) return false;
      if (lib.cats.size && !lib.cats.has(r.category || "Uncategorized")) return false;
      if (lib.author && A(r).toLowerCase() !== lib.author.toLowerCase()) return false;
      const tg = toArr(tags[r.name]);
      if (lib.tags.size && ![...lib.tags].some(t => tg.includes(t))) return false;
      if (lib.support && !toArr(r.support).length) return false;
      if (q) { const hay = `${T(r)} ${r.name} ${A(r)} ${tg.join(" ")} ${r.notes || ""}`.toLowerCase(); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
      return true;
    });
    const rate = r => r.urating || r.rating || 0;
    const by = { name: (a, b) => T(a).localeCompare(T(b)), size: (a, b) => b.size - a.size, added: (a, b) => b.added - a.added,
      updated: (a, b) => ((b.updated || b.modified || 0) - (a.updated || a.modified || 0)), active: (a, b) => (b.active - a.active) || T(a).localeCompare(T(b)),
      recent: (a, b) => (b.activeAt || 0) - (a.activeAt || 0) || T(a).localeCompare(T(b)), rating: (a, b) => rate(b) - rate(a), downloads: (a, b) => (b.downloads || 0) - (a.downloads || 0) };
    rows.sort(by[pg === "recent" ? "recent" : lib.sort] || by.name);
    if (lib.stack) {
      const seen = new Map(), out = [];
      for (const r of rows) {
        const k = r.stack || r.name;
        if (!seen.has(k)) { seen.set(k, out.length); out.push(Object.assign({}, r, { _stack: [r] })); }
        else { const top = out[seen.get(k)]; top._stack.push(r); if (r.active && !top.active) out[seen.get(k)] = Object.assign({}, r, { _stack: top._stack }); }
      }
      return out;
    }
    return rows.map(r => Object.assign({}, r, { _stack: [r] }));
  }
  const ISSUE = { D: ["dup", "Duplicate", "⧉"], C: ["conf", "File conflict", "⚠"], R: ["req", "Missing requirement", "⛓"] };
  function issueBadges(r, ups) {
    const iss = String(r.issues || "").split("").filter((c, i, a) => ISSUE[c] && a.indexOf(c) === i);
    return (r.tagid && ups.has(String(r.tagid)) ? `<span class="liss upd" title="Update available">⬆</span>` : "")
      + iss.map(c => `<span class="liss ${ISSUE[c][0]}" title="${ISSUE[c][1]}">${ISSUE[c][2]}</span>`).join("")
      + (toArr(r.support).length ? `<span class="liss sup" title="Supports the creator: ${esc(toArr(r.support).map(s => SUPPORT_NAMES[s.kind] || s.kind).join(", "))}">♥</span>` : "");
  }
  function libCard(r, ups) {
    const fav = (lib.data.fav || {})[r.name], th = r.cover || r.thumb || r.icon || (toArr(r.photos)[0] || {}).fb, n = esc(r.name), vs = r._stack.length;
    const verChip = `${r.version ? `<span class="vchip" title="Version">${esc(r.version)}</span>` : ""}${vs > 1 ? `<span class="vchip st" data-a="ldrawer" data-n="${n}" title="${vs} versions in your library">${vs} versions</span>` : ""}`;
    if (lib.view === "list") return `<div class="lrow ${r.active ? "" : "off"} ${lib.sel.has(r.name) ? "sel" : ""}" data-key="l-${n}">
      <span class="lsel" data-a="lsel" data-n="${n}">${lib.sel.has(r.name) ? "☑" : "☐"}</span>
      <div class="lrth">${img(th, "", r.icon)}</div>
      <div class="lrt" data-a="ldrawer" data-n="${n}"><b>${esc(T(r))}</b> ${verChip}<span class="ca">${esc(A(r))}</span></div>
      <span class="lrc">${esc(r.category || r.type || "")}</span><span class="lrc">${fmtBytes(r.size)}</span><span class="lri">${issueBadges(r, ups)}</span>
      <span class="lfav ${fav ? "on" : ""}" data-a="lfav" data-n="${n}">${bi(fav ? "★" : "☆")}</span>
      <div class="tog ${r.active ? "on" : ""}" data-a="lact" data-n="${n}"><i></i></div></div>`;
    return `<div class="lcard ${r.active ? "" : "off"} ${lib.sel.has(r.name) ? "sel" : ""}" data-key="l-${n}">
      <div class="lth" data-a="ldrawer" data-n="${n}">${img(th, "", r.icon)}
        <span class="lsel" data-a="lsel" data-n="${n}">${lib.sel.has(r.name) ? "☑" : "☐"}</span>
        <span class="lfav ${fav ? "on" : ""}" data-a="lfav" data-n="${n}" title="Favorite">${bi(fav ? "★" : "☆")}</span>
        <span class="lbdg">${issueBadges(r, ups)}</span></div>
      <div class="lbody"><div class="ct" title="${esc(T(r))}" data-a="ldrawer" data-n="${n}">${esc(T(r))}</div>
        <div class="vrow">${verChip}</div>
        <div class="ca">${esc([A(r), fmtBytes(r.size)].filter(Boolean).join(" · "))}</div>
        <div class="tog ${r.active ? "on" : ""}" data-a="lact" data-n="${n}">${r.active ? "Active" : "Inactive"}<i></i></div></div></div>`;
  }
  function chipsRow() {
    const c = [];
    for (const x of lib.cats) c.push(["cat", x, "Category: " + x]);
    if (lib.author) c.push(["author", "", "Author: " + lib.author]);
    for (const t of lib.tags) c.push(["tag", t, "Tag: " + t]);
    if (lib.support) c.push(["support", "", "Supported creators"]);
    if (lib.q) c.push(["q", "", `“${lib.q}”`]);
    return c.length ? `<div class="achips" data-key="lchips">${c.map(([k, v, l]) => `<span class="achip" data-a="lunf" data-k="${k}" data-v="${esc(v)}">${esc(l)} ✕</span>`).join("")}<span class="clrall" data-a="lclear">Clear filters</span></div>` : "";
  }
  function filterPanel() {
    if (!lib.filters) return "";
    const all = mods(), tags = [...new Set([...SUGGESTED_TAGS, ...Object.values(lib.data.tags || {}).flatMap(toArr)])];
    const cats = [...new Set(all.map(r => r.category || "Uncategorized"))].sort();
    const authors = [...new Set(all.map(A).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return `<div class="lfp" data-key="lfp"><div><h5>Category</h5>${cats.map(c => `<label class="cb ${lib.cats.has(c) ? "on" : ""}" data-a="lcat" data-v="${esc(c)}"><i></i>${esc(c)} <span>${all.filter(r => (r.category || "Uncategorized") === c).length}</span></label>`).join("")}</div>
      <div><h5>Author</h5><input class="fi" list="rfm-authors" data-lf="author" placeholder="Type an author…" value="${esc(lib.author)}"><datalist id="rfm-authors">${authors.map(a => `<option value="${esc(a)}">`).join("")}</datalist>
        <h5>Tags</h5><div class="ltags">${tags.map(t => `<span class="ltag ${lib.tags.has(t) ? "on" : ""}" data-a="ltagf" data-t="${esc(t)}">${esc(t)}</span>`).join("")}</div>
        <h5>Creators</h5><div class="tog ${lib.support ? "on" : ""}" data-a="lsupport">♥ Supported creators only<i></i></div></div></div>`;
  }
  function libModsHTML(title) {
    const d = lib.data, rows = libRows(), ups = updIds(), sel = lib.sel.size;
    const sorts = [["name", "Name"], ["active", "Active first"], ["recent", "Recently active"], ["added", "Recently added"], ["updated", "Recently updated"], ["size", "Size"], ["rating", "Rating"], ["downloads", "Downloads"]];
    const los = toArr(d.loadouts);
    return `<div class="ltb" data-key="ltb"><input class="fi lq" data-lf="q" placeholder="Search your mods, authors, tags, notes…" value="${esc(lib.q)}">
        <select class="fi lsort" data-lf="sort">${sorts.map(([k, n]) => `<option value="${k}" ${lib.sort === k ? "selected" : ""}>${n}</option>`).join("")}</select>
        <span class="seg"><b class="${lib.view === "grid" ? "on" : ""}" data-a="lview" data-v="grid" title="Grid">▦</b><b class="${lib.view === "list" ? "on" : ""}" data-a="lview" data-v="list" title="List">☰</b></span>
        <span class="chip ${lib.stack ? "on" : ""}" data-a="lstack" title="Collapse multiple versions of a mod into one card">Stack versions</span>
        <span class="chip ${lib.filters ? "on" : ""}" data-a="lfilters">Filters</span>
        <span class="chip" data-a="lselall">Select all</span></div>
      ${filterPanel()}${chipsRow()}
      ${sel ? `<div class="bulk" data-key="bulk"><b>${sel} selected</b><button class="btn sec" data-a="lbulk" data-v="on">Activate</button><button class="btn sec" data-a="lbulk" data-v="off">Deactivate</button>
        <button class="btn sec" data-a="lbulkrecycle">Delete (recycle)…</button>
        <select class="fi" data-lf="bulkLo"><option value="">Add to mod pack…</option>${los.map(lo => `<option value="${esc(lo.id)}">${esc((lo.emoji ? lo.emoji + " " : "") + lo.name)}</option>`).join("")}<option value="__new">+ New mod pack from selection</option></select>
        <span class="clrall" data-a="lselclear">Clear selection</span></div>` : ""}
      <div class="rhead"><h2>${esc(title)}</h2><span>${rows.length} shown · ${d.total} installed · ${d.active} active</span>${d.busy ? `<span class="catp">Applying ${d.busy.done}/${d.busy.total}…</span>` : ""}</div>
      ${rows.length ? `<div class="${lib.view === "list" ? "llist" : "lgrid"}">${rows.map(r => libCard(r, ups)).join("")}</div>` : (mods().length ? emptyState("⌕", "No mods match", "Try fewer filters, or press “Clear filters”.", (lib.q || lib.cats.size || lib.tags.size || lib.author || lib.support) ? ["lclear", "Clear filters"] : null) : emptyState("▤", "No mods installed yet", "Open the Discover or Browse tab, find a mod you like and press Subscribe."))}`;
  }

  // ---- details drawer ----
  function drawerShots(r) {
    const online = toArr(r.images).filter(u => typeof u === "string" && u);
    const local = toArr(r.photos).filter(p => p && typeof p.u === "string" && p.u).map(p => ({ u: p.u, fb: typeof p.fb === "string" ? p.fb : "" }));
    const icon = r.icon || r.thumb || "";
    const list = [];
    if (r.cover) list.push({ u: r.cover, fb: r.thumb || icon });
    if (online.length && online.length >= local.length) online.forEach((u, i) => list.push({ u, fb: local[i] ? (local[i].fb || local[i].u) : icon }));
    else local.forEach(p => list.push({ u: p.u, fb: p.fb || icon }));
    if (r.thumb) list.push({ u: r.thumb, fb: r.icon || "" });
    if (r.icon) list.push({ u: r.icon, fb: "" });
    const out = [], seen = new Set();
    for (const p of list) {
      const u = goodSrc(p.u, p.fb); if (!u || seen.has(u)) continue;
      seen.add(u); if (u !== p.u) seen.add(p.u);
      out.push({ u, fb: u === p.u && p.fb && !badImg.has(p.fb) && !seen.has(p.fb) ? p.fb : "" });
    }
    return out;
  }
  function drawerImages(r) { return drawerShots(r).map(p => p.u); }
  const dt = t => t ? new Date(t * 1000).toISOString().slice(0, 10) : "—";
  function drawerHTML() {
    const r = lib.drawer && byName(lib.drawer); if (!r) return "";
    const n = esc(r.name), shots = drawerShots(r), imgs = shots.map(p => p.u), i = Math.min(lib.shot, Math.max(0, imgs.length - 1));
    const e = lib.edit && lib.edit.name === r.name ? lib.edit : null, tg = toArr((lib.data.tags || {})[r.name]);
    const res = byRes(), h = lib.health || {};
    const depRow = (id, kind) => { const m = res.get(+id), dis = notDep(r.name, id);
      const st2 = !m ? "missing" : m.active ? "active" : "inactive";
      return `<div class="hm ${dis ? "dis" : ""}">${st2 === "active" ? "✓" : st2 === "inactive" ? "○" : "✕"} ${esc(m ? T(m) : "Resource #" + id)} <span class="phnote">${dis ? "not a requirement" : st2 === "missing" ? "not installed" : st2}</span>
        ${!dis && st2 === "inactive" ? `<span class="clrall" data-a="lact" data-n="${esc(m.name)}">Activate</span>` : ""}
        ${!dis && st2 === "missing" ? `<span class="clrall" data-a="depfind" data-q="${esc(id)}">Find in repository</span>` : ""}
        ${kind === "req" ? `<span class="clrall" data-a="lnotdep" data-n="${n}" data-id="${esc(id)}" data-v="${dis ? 0 : 1}">${dis ? "Re-include" : "Not a requirement"}</span>` : ""}</div>`; };
    const confs = toArr(h.conflicts).filter(c => c.a === r.name || c.b === r.name);
    const vers = mods().filter(x => x.stack === r.stack);
    const kv = [["File", r.file], ["Size", fmtBytes(r.size)], ["Version", r.version], ["Date added", dt(r.added)], ["Category", r.category || r.type], ["Repository rating", r.rating ? `${(+r.rating).toFixed(1)} ★ (${r.ratings || 0})` : null],
      ["Downloads", r.downloads ? Number(r.downloads).toLocaleString("en-US") : null], ["Published", r.published ? dt(r.published) : null], ["Updated", r.updated ? dt(r.updated) : null], ["Last activated", r.activeAt ? rel(r.activeAt) : null]];
    return `<div class="drw" data-key="drawer"><span class="close" data-a="ldrawerx">✕</span>
      <div class="car">${imgs.length ? `<div class="noimg ph">Loading photo…</div><img class="im" data-key="shot-${esc(imgs[i])}" src="${esc(imgs[i])}"${shots[i].fb ? ` data-fb="${esc(shots[i].fb)}"` : ""} alt="">` : `<div class="noimg">No photos</div>`}
        ${imgs.length > 1 ? `<b class="cprev" data-a="lshot" data-d="-1">${bi("‹")}</b><b class="cnext" data-a="lshot" data-d="1">${bi("›")}</b><span class="ccount">${i + 1} / ${imgs.length}</span>` : ""}</div>
      ${e ? `<div class="lform"><input class="fi" data-le="title" value="${esc(e.title)}" placeholder="Name (${esc(r.title)})"><input class="fi" data-le="author" value="${esc(e.author)}" placeholder="Author (${esc(r.author || "")})">
          <input class="fi" data-le="cover" value="${esc(e.cover)}" placeholder="Custom cover image URL"><textarea class="fi ta" data-le="notes" placeholder="Notes">${esc(e.notes)}</textarea>
          <div class="lobtns"><button class="btn pri" data-a="leditsave">Save</button><button class="btn sec" data-a="leditx">Cancel</button></div></div>`
        : `<h3>${esc(T(r))}</h3><div class="ca">${esc(A(r))}${r.ctitle || r.cauthor ? ` <span class="phnote">(edited)</span>` : ""}</div>
          <div class="stars">${[1, 2, 3, 4, 5].map(k => `<b class="${(r.urating || 0) >= k ? "on" : ""}" data-a="lrate" data-n="${n}" data-v="${k === r.urating ? 0 : k}">★</b>`).join("")}<span class="phnote">your rating</span></div>
          ${r.notes ? `<div class="descb">${esc(r.notes)}</div>` : ""}`}
      <div class="lobtns"><div class="tog ${r.active ? "on" : ""}" data-a="lact" data-n="${n}">${r.active ? "Active" : "Inactive"}<i></i></div>
        ${e ? "" : `<button class="btn sec" data-a="ledit" data-n="${n}">Edit details</button>`}
        ${imgs.length ? `<button class="btn sec" data-a="lsetcover" data-n="${n}" data-v="${esc(imgs[i])}">Use photo as cover</button>` : ""}
        ${r.tagid ? `<button class="btn sec" data-a="lrepo" data-id="${esc(r.tagid)}">Open repo page</button>` : ""}
        ${toArr(r.support).map(s => `<button class="btn sup" data-a="lurl" data-v="${esc(s.url)}">♥ Support the creator (${esc(SUPPORT_NAMES[s.kind] || s.kind)})</button>`).join("")}</div>
      <h4>Tags</h4><div class="ltags">${tg.map(t => `<span class="ltag">${esc(t)}<b data-a="ltagrm" data-n="${n}" data-t="${esc(t)}">×</b></span>`).join("")}
        ${lib.tagEdit === r.name ? `<input class="fi ltin" data-lf="tag" data-n="${n}" placeholder="tag + Enter" maxlength="24">` : `<span class="ltag add" data-a="ltagadd" data-n="${n}">+ tag</span>`}
        ${SUGGESTED_TAGS.filter(t => !tg.includes(t)).slice(0, 4).map(t => `<span class="ltag sug" data-a="ltagquick" data-n="${n}" data-t="${esc(t)}">+ ${esc(t)}</span>`).join("")}</div>
      <h4>Details</h4>${kv.filter(x => x[1]).map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`).join("")}
      <h4>Dependencies</h4>${toArr(r.reqIds).length ? `<div class="phnote">Required (from the description)</div>${toArr(r.reqIds).map(id => depRow(id, "req")).join("")}` : `<div class="phnote">No requirements found in the description.</div>`}
        ${toArr(r.mentionIds).length ? `<div class="phnote">Mentioned (not marked as required)</div>${toArr(r.mentionIds).map(id => depRow(id, "men")).join("")}` : ""}
      <h4>Conflicts</h4>${confs.length ? confs.map(c => `<div class="hm">⚠ ${esc(modTitle(c.a === r.name ? c.b : c.a))} — ${c.count} shared file${c.count > 1 ? "s" : ""}</div>`).join("") : `<div class="phnote">${lib.health && lib.health.scannedAt ? "No file conflicts with active mods." : "Run a scan (Conflicts page) to check."}</div>`}
      <h4>Versions in library <span class="phnote">${vers.length}</span></h4>${vers.map(v => `<div class="hm">${v.active ? "●" : "○"} ${esc(v.file || v.name)} ${v.version ? `<span class="vchip">${esc(v.version)}</span>` : ""} <span class="phnote">${fmtBytes(v.size)}</span>
        ${vers.length > 1 && !v.active ? `<span class="clrall" data-a="lswitch" data-n="${esc(v.name)}">Switch to</span><span class="clrall" data-a="lrecycle1" data-n="${esc(v.name)}">Delete</span>` : ""}</div>`).join("")}</div>`;
  }

  // ---- pages ----
  function loCover(lo) {
    if (lo.cover) return lo.cover;
    const keys = toArr(lo.mods);
    const m = mods().find(r => (keys.includes(r.key) || keys.includes("n:" + r.name)) && (r.cover || r.thumb || r.icon));
    return m ? (m.cover || m.thumb || m.icon) : "";
  }
  const LO_COLORS = ["var(--acc)", "#2f7bff", "#1fae5b", "#a879ff", "#e5383b", "#14b8c4", "#f5c04a"];
  function emptyState(ico, title, text, action) {
    return `<div class="empty es"><i>${ico}</i><b>${esc(title)}</b><span>${esc(text)}</span>${action ? `<button class="btn pri" data-a="${action[0]}">${esc(action[1])}</button>` : ""}</div>`;
  }
  function loadoutEditor(lo) {
    const keys = toArr(lo.mods), all = mods();
    const items = keys.map(k => ({ k, r: all.find(r => r.key === k || "n:" + r.name === k) }));
    return `<div class="lform" data-key="loed"><h3>Edit mod pack</h3>
      <div class="frow"><input class="fi" style="width:70px" data-loe="emoji" value="${esc(lib.loEdit.emoji || "")}" placeholder="🏁" maxlength="8"><input class="fi" data-loe="name" value="${esc(lib.loEdit.name)}" maxlength="60" placeholder="Title (required)"></div>
      <textarea class="fi ta" data-loe="desc" maxlength="300" placeholder="Short description (required to share), e.g. what the pack is for and which map to use" style="min-height:70px">${esc(lib.loEdit.desc || "")}</textarea>
      <div class="cnt2" data-key="dcnt">${(lib.loEdit.desc || "").length}/300</div>
      <div class="tog ${lib.loEdit.alwaysOn ? "on" : ""}" data-a="loetog" data-k="alwaysOn">Always On (stays active with every mod pack)<i></i></div>
      <div class="tog ${lib.loEdit.pinned ? "on" : ""}" data-a="loetog" data-k="pinned">Pin exact versions (don't follow updates to newer files)<i></i></div>
      <input class="fi" data-loe="cover" value="${esc(lib.loEdit.cover || "")}" placeholder="Cover image URL (empty = first mod's photo)">
      <h4>${items.length} mods</h4>${items.map(x => `<div class="hm">${x.r ? (x.r.active ? "●" : "○") + " " + esc(T(x.r)) : `✕ <span class="phnote">${esc(x.k)} (not installed)</span>`}<span class="clrall" data-a="loermmod" data-k="${esc(x.k)}">Remove</span></div>`).join("")}
      <div class="phnote">Add mods: select them in the library and pick this mod pack in “Add to mod pack…”.</div>
      <div class="lobtns"><button class="btn pri" data-a="loesave">Save</button><button class="btn sec" data-a="loex">Cancel</button></div></div>`;
  }
  function missingHTML() {
    const m = toArr(lib.missing); if (!m.length) return "";
    return `<div class="lform" data-key="miss"><h3>Not installed (${m.length})</h3>${m.map(x => `<div class="hm">✕ ${esc(x.title || x.name || x.tagid)}
        ${x.tagid ? `<span class="clrall" data-a="lrepo" data-id="${esc(x.tagid)}">Repo page</span><span class="clrall" data-a="lsubmiss" data-id="${esc(x.tagid)}">Subscribe</span>` : ""}</div>`).join("")}
      ${m.some(x => x.tagid) ? `<button class="btn pri" data-a="lsubmissall">Subscribe to all</button>` : ""} <span class="clrall" data-a="lmissx">Dismiss</span></div>`;
  }
  // native file dialog via a hidden <input type=file> (kept outside the morph-diffed tree), read with FileReader
  let packInput = null;
  function pickPackFile() {
    try {
      if (!packInput) {
        packInput = document.createElement("input");
        packInput.type = "file"; packInput.accept = ".json,.rfpack.json,.rfloadout.json"; packInput.style.display = "none"; packInput.id = "rfm-packfile";
        packInput.addEventListener("change", () => {
          const f = packInput.files && packInput.files[0]; packInput.value = "";
          if (!f) return;
          if (!/\.json$/i.test(f.name)) { lib.msg = { type: "error", msg: f.name + " is not a mod pack file (.rfpack.json)." }; render(false); return; }
          if (f.size > 512 * 1024) { lib.msg = { type: "error", msg: f.name + " is too large to be a mod pack." }; render(false); return; }
          const r = new FileReader();
          r.onload = () => libCall("uiPreviewPackText", String(r.result || "").replace(/^\uFEFF/, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, " "), f.name);
          r.onerror = () => { lib.msg = { type: "error", msg: "Couldn't read " + f.name + "." }; render(false); };
          r.readAsText(f);
        });
        document.body.appendChild(packInput);
      }
      packInput.click();
    } catch (e) { lib.msg = { type: "error", msg: "The file window couldn't open here. Use “Scan my BeamNG folders” below." }; render(false); }
  }
  // downloads started by importing this pack: failed ones get Retry here (and in the Downloads panel)
  function packDlHTML(lo) {
    const mine = dl.list().filter(v => v.pack === lo.id && v.id != null);
    const fail = mine.filter(v => v.state === "failed"), act = mine.filter(v => v.state === "queued" || v.state === "downloading" || v.state === "installing");
    if (!fail.length && !act.length) return "";
    return `<div class="pkdl" data-key="pkdl-${esc(lo.id)}">${act.length ? `<span>⬇ ${act.length} downloading</span>` : ""}${fail.length ? `<span class="bad" title="${esc(fail.map(v => (modInfo(v).title || v.title || v.id) + ": " + (v.error || "failed")).join("\n"))}">✕ ${fail.length} failed</span>
      <button class="btn sec" data-a="retrypack" data-id="${esc(lo.id)}">↻ Retry ${fail.length}</button>` : ""}</div>`;
  }
  // saved server mods (marketplaceModMP: copies of a BeamMP server's mods, outside the mods folder)
  function serverPacksHTML() {
    const d = lib.spacks; if (!d) return "";
    const packs = toArr(d.packs), job = d.job, tot = packs.reduce((a, p) => a + (p.bytes || 0), 0);
    const lab = { saved: "Saved · not in use", inactive: "Installed · off", active: "On (single-player)", partly: "Partly on", empty: "Empty" };
    return `<div class="lform" data-key="spacks"><h3>Saved server mods <span class="phnote">${packs.length ? packs.length + " server" + (packs.length > 1 ? "s" : "") + " · " + fmtBytes(tot) + " on disk" : ""}</span></h3>
      <div class="phnote">BeamMP keeps every server mod it downloads in its own cache (<b>%APPDATA%\\BeamMP-Launcher\\Resources</b>) and copies it from there when you rejoin, so a rejoin only downloads mods the server changed. Saving a server's mods gives you your own permanent copy as well: turn on <b>Keep this server's mods</b> in the join window or on the server's page. The copies are never loaded, not online and not in single-player, until you press <b>Use in single-player</b>; on any BeamMP server, BeamMP turns them off again. If BeamMP's cache was ever cleared, copy these files into that Resources folder and BeamMP uses them instead of downloading (it checks every file).</div>
      ${job ? `<div class="spjob" data-key="spjob"><b>Saving the mods of ${esc(job.name || "")}</b> · ${job.done}/${job.total}${job.cur ? " · " + esc(job.cur) : ""} · ${fmtBytes(job.bytes || 0)} copied<div class="mpjbar"><i style="width:${job.total ? Math.round(job.done / job.total * 100) : 0}%"></i></div></div>` : ""}
      ${packs.map(p => `<div class="pkfile spk" data-key="sp-${esc(p.id)}"><div class="nm"><b>🌐 ${esc(p.name || p.key)}</b><span>${esc(p.key || "")} · ${p.count} mods${p.total && p.total > p.count ? " of " + p.total : ""} · ${fmtBytes(p.bytes || 0)} · ${lab[p.state] || esc(p.state)}${p.updates ? ` · ${p.updates} updated` : ""}${p.missing ? ` · <span style="color:var(--bad)">${p.missing} files gone</span>` : ""}${p.partial ? " · incomplete (saved again on your next join)" : ""}${p.savedAt ? " · saved " + esc(rel(p.savedAt)) : ""}</span></div>
          <div class="lobtns">${p.state === "active" || p.state === "partly" ? `<button class="btn sec" data-a="spoff" data-id="${esc(p.id)}">Turn off</button>` : ""}${p.state !== "active" ? `<button class="btn go" data-a="spon" data-id="${esc(p.id)}" title="Single-player only">Use in single-player</button>` : ""}
          <button class="btn ghost" data-a="spopen" data-id="${esc(p.id)}" title="Open the folder">📂</button><button class="btn sec" data-a="spdel" data-id="${esc(p.id)}">Delete</button></div></div>`).join("")
        || `<div class="phnote" style="margin-top:8px">No saved server mods yet.</div>`}</div>`;
  }
  function libLoadoutsHTML() {
    const los = toArr(lib.data.loadouts);
    const ed = lib.loEdit && los.find(x => x.id === lib.loEdit.id);
    return `<div class="rhead"><h2>Mod Packs</h2><span>${los.length} saved · drag cards to reorder</span><button class="btn pri pkhead" data-a="pkbrowse" title="Pick a .rfpack.json file from anywhere, e.g. Downloads">⬇ Import Mod Pack</button></div>${missingHTML()}${ed ? loadoutEditor(ed) : ""}
      <div class="logrid big">${los.map((lo, li) => `<div class="locard ${lib.dragId === lo.id ? "drag" : ""}" style="--lc:${LO_COLORS[li % LO_COLORS.length]}" draggable="true" data-lo="${esc(lo.id)}" data-key="lo-${esc(lo.id)}"><div class="locov">${loCover(lo) ? `<img class="im" src="${esc(loCover(lo))}" alt="">` : ""}
          ${lo.emoji ? `<span class="loemo">${esc(lo.emoji)}</span>` : ""}${lo.alwaysOn ? `<span class="pfx">📌 ALWAYS ON</span>` : ""}${lo.pinned ? `<span class="pfx pin">PINNED</span>` : ""}</div>
        <div class="lbody"><div class="ct">${esc(lo.name)}</div><div class="ca">${lo.count} mods · ${fmtBytes(lo.size || 0)}${lo.missing ? ` · <span style="color:var(--bad)">${lo.missing} missing</span>` : ""}</div>${packDlHTML(lo)}
          <div class="ldesc">${lo.desc ? esc(lo.desc) : `<span style="color:var(--tx3)">No description yet. Add one with Edit to share this pack.</span>`}</div>
          <div class="lobtns"><button class="btn go" data-a="loapply" data-id="${esc(lo.id)}" title="Turn on exactly these mods (asks first)">Activate</button>
          <button class="btn sec" data-a="loedit" data-id="${esc(lo.id)}">Edit</button><button class="btn sec" data-a="loview" data-id="${esc(lo.id)}">Mods</button>
          <button class="btn sec" data-a="loalways" data-id="${esc(lo.id)}" title="Always On">${lo.alwaysOn ? "Unpin" : "📌"}</button>
          <button class="btn sec" data-a="pkexport" data-id="${esc(lo.id)}" title="Save a .rfpack.json file you can send to friends">Export / Share</button><button class="btn sec" data-a="lodel" data-id="${esc(lo.id)}">Delete</button></div></div></div>`).join("")
        || emptyState("▣", "No mod packs yet", "A mod pack is a saved set of mods. Type a name below and press “Save current mods as a mod pack”.")}</div>${serverPacksHTML()}
      <div class="lform"><h3>New mod pack</h3><div class="frow"><input class="fi" data-lf="loName" placeholder="Name, e.g. Drift night" value="${esc(lib.loName)}" maxlength="60">
        <button class="btn pri" data-a="losave">Save current mods as a mod pack</button></div>
        <textarea class="fi ta" data-lf="loDesc" maxlength="300" placeholder="Short description (required), e.g. Drift cars + Utah, all tuned for 0.39" style="min-height:60px">${esc(lib.loDesc)}</textarea>
        <div class="tog ${lib.loAlways ? "on" : ""}" data-a="lalways">Always On<i></i></div></div>
      ${lib.packExport ? `<div class="lform" data-key="pkexp"><h3>${lib.packExport.ok ? "✓ Mod pack file saved" : "Couldn't save the file"}</h3>
        ${lib.packExport.ok ? `<div class="phnote">Saved <b>${esc(lib.packExport.file)}</b>. Click <b>Open folder</b>, then send that file to your friends (Discord, email, …).</div><div class="phnote" style="overflow-wrap:anywhere">${esc(lib.packExport.path || "")}</div>` : `<div class="phnote">${esc(lib.packExport.error || "")}</div>`}
        <div class="lobtns"><button class="btn pri" data-a="pkopen">📂 Open folder</button><button class="btn sec" data-a="pkexpx">Close</button></div></div>` : ""}
      <div class="lform" data-key="pkimp"><h3>Import Mod Pack</h3>
        <div class="phnote">Got a <b>.rfpack.json</b> file from a friend? Click below and pick it wherever you saved it (for example your <b>Downloads</b> folder).</div>
        <div class="lobtns"><button class="btn pri pkbig" data-a="pkbrowse">📄 Choose mod pack file…</button></div>
        <details class="pkalt" style="margin-top:10px" ${lib.packFiles ? "open" : ""}><summary class="phnote" style="cursor:pointer">No file window? Scan my BeamNG folders instead</summary>
        <div class="phnote">Looks in your BeamNG <b>mods</b> folder (all subfolders) and <b>Marketplace › shared</b>.</div>
        ${lib.packFiles && lib.packFiles.modsFolder ? `<div class="phnote" style="overflow-wrap:anywhere">Mods folder: <b>${esc(lib.packFiles.modsFolder)}</b><br>Shared folder: <b>${esc(lib.packFiles.folder || "")}</b></div>` : ""}
        <div class="lobtns"><button class="btn sec" data-a="pklist">${lib.packFiles ? "↻ Rescan" : "Scan folders"}</button><button class="btn ghost" data-a="pkopenmods">📂 Mods folder</button><button class="btn ghost" data-a="pkopen">📂 Shared folder</button></div>
        ${lib.packFiles ? (toArr(lib.packFiles.files).map(f => `<div class="pkfile" data-key="pf-${esc(f.path)}"><div class="nm"><b>${esc(f.title || f.file)}</b><span><i class="pkwhere">${esc(f.where || "shared")}</i>${esc(f.real || f.file)}${f.valid ? ` · ${f.count} mods` : " · not a valid mod pack file"}${f.legacy ? " · older format" : ""}</span></div>
            ${f.valid ? `<button class="btn sec" data-a="pkpick" data-f="${esc(f.path)}">Preview & import</button>` : ""}</div>`).join("") || `<div class="phnote" style="margin-top:8px">No mod pack files found.</div>`) : ""}</details>
        <details style="margin-top:10px"><summary class="phnote" style="cursor:pointer">Paste mod pack text instead</summary>
          <textarea class="fi ta" data-lf="importText" placeholder="Paste the contents of a .rfpack.json or .rfloadout.json file">${esc(lib.importText)}</textarea>
          <button class="btn sec" data-a="loimport">Import pasted</button></details></div>`;
  }
  function packPreviewHTML() {
    const p = lib.pack; if (!p) return "";
    const mods = toArr(p.mods), lab = { installed: "Installed", missing: "Will download", unavailable: "Not available" };
    return `<div class="modal" data-key="pkmodal"><div class="mbox pkbox"><span class="phnote">Import mod pack${p.file ? " · " + esc(p.file) : ""}</span><h3 style="margin:0;overflow-wrap:anywhere">${esc(p.title)}</h3>
      ${p.description ? `<div class="pkdesc">${esc(p.description)}</div>` : ""}
      <div class="pkl">${mods.map(m => `<div class="pkrow"><b title="${esc(m.title || m.name || m.tagid)}">${esc(m.title || m.name || m.tagid)}</b><span>${m.size ? fmtBytes(+m.size) : "—"}</span><span class="pkst ${esc(m.status)}">${lab[m.status] || esc(m.status)}</span></div>`).join("")}</div>
      ${toArr(p.requires).length ? `<h4 style="margin:10px 0 4px">Required by these mods (${toArr(p.requires).length})</h4><div class="pkl">${toArr(p.requires).map(m => `<div class="pkrow"><b title="${esc((m.title || m.tagid) + " · needed by " + (m.forTitle || ""))}">${esc(m.title || m.tagid)}</b><span>${m.size ? fmtBytes(+m.size) : "—"}</span><span class="pkst ${esc(m.status === "unknown" ? "unavailable" : m.status)}">${m.status === "installed" ? "Installed" : m.status === "missing" ? "Will download" : "Not in catalog"}</span></div>`).join("")}</div>` : ""}
      ${p.skipped ? `<div class="phnote" style="color:var(--bad)">This file lists ${p.skipped} more mods than the ${500}-mod limit; only the first 500 are imported.</div>` : ""}
      <div class="pktot"><span><b>${mods.length}</b> mods</span><span><b>${mods.filter(m => m.status === "installed").length}</b> installed</span><span><b>${(p.missing || 0) + (p.reqMissing || 0)}</b> to download · <b>${fmtBytes(p.totalBytes || 0)}</b></span>${p.unavailable ? `<span style="color:var(--bad)"><b>${p.unavailable}</b> not available (removed or not from the repository)</span>` : ""}</div>
      <div class="lobtns"><button class="btn pri" data-a="pkok">${p.missing || p.reqMissing ? "Download all & add pack" : "Add pack"}</button><button class="btn sec" data-a="pkno">Cancel</button></div></div></div>`;
  }
  function scanHead(title, sub) {
    const h = lib.health;
    return `<div class="rhead"><h2>${title}</h2><span>${h && h.scanning ? `Scanning ${h.progress ? `${h.progress.done}/${h.progress.total}` : ""}…` : h && h.scannedAt ? "Last scan " + rel(h.scannedAt) : "Not scanned yet"}${sub ? " · " + sub : ""}</span>
      <button class="btn sec" style="margin-left:auto" data-a="lscan">${h ? "Re-scan" : "Scan now"}</button></div>`;
  }
  // keep suggestion (mirror of marketplaceModLibCore.keepReasons)
  function keepOf(names) {
    const rs = names.map(byName).filter(Boolean);
    const newer = (a, b) => (a.updated || 0) !== (b.updated || 0) ? (a.updated || 0) > (b.updated || 0) : (a.verId || 0) !== (b.verId || 0) ? (a.verId || 0) > (b.verId || 0) : (a.modified || 0) > (b.modified || 0);
    let best = null; for (const r of rs) if (!best || newer(r, best)) best = r;
    if (!best) return { keep: names[0], why: [] };
    const why = [];
    if (rs.some(r => r !== best && (best.updated || 0) > (r.updated || 0))) why.push("newest repository update");
    if (best.active) why.push("currently active");
    if (best.repo) why.push("from the repository (gets updates)");
    if (!why.length) why.push("most recently modified file");
    return { keep: best.name, why };
  }
  function versionPlan(keep) {
    const groups = new Map();
    for (const r of mods()) { const k = r.stack || r.name; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    const drop = [];
    const newer = (a, b) => ((b.updated || 0) - (a.updated || 0)) || ((b.verId || 0) - (a.verId || 0)) || ((b.modified || 0) - (a.modified || 0));
    for (const list of groups.values()) if (list.length > 1) { list.sort(newer); let kept = 0; for (const r of list) { if (kept < keep || r.active) kept++; else drop.push(r.name); } }
    return { drop, stacks: [...groups.values()].filter(l => l.length > 1) };
  }
  function libDupHTML() {
    const h = lib.health, kinds = { id: "Same repository mod installed twice", hash: "Identical content", versions: "Multiple versions (by file name)" };
    const dups = toArr(h && h.duplicates), same = dups.map((g, i) => [g, i]).filter(([g]) => g.kind !== "versions");
    const vp = versionPlan(lib.keep), rec = toArr(lib.data.recycle), now = Date.now() / 1000;
    const cmp = lib.cmp != null && dups[lib.cmp];
    return scanHead("Duplicates", `${dups.length} groups`) + (cmp ? compareHTML(cmp) : "")
      + `<h3 class="lh">Identical / same mod twice <span>${same.length}</span></h3>${same.map(([g, i]) => { const k = keepOf(toArr(g.mods));
        return `<details class="hrow" data-key="dup-${i}"><summary><b>${kinds[g.kind] || g.kind}</b> — ${esc(modTitle(k.keep))} <span class="phnote">${toArr(g.mods).length} copies</span>
          <button class="btn sec" data-a="dupcmp" data-i="${i}">Resolve…</button></summary>
          ${toArr(g.mods).map(n => `<div class="hm">${n === k.keep ? "✓ keep" : "•"} ${esc(modTitle(n))} <span class="phnote">${esc(n)}</span></div>`).join("")}</details>`; }).join("") || `<div class="phnote">${h ? "No identical duplicates." : "Run a scan to look for identical files."}</div>`}
      <h3 class="lh">Multiple versions <span>${vp.stacks.length}</span></h3>
      <div class="lform"><div class="frow"><span>Versions to keep: <b>${lib.keep}</b></span><input type="range" min="1" max="5" step="1" data-lf="keep" value="${lib.keep}" style="flex:1">
        <button class="btn ${vp.drop.length ? "pri" : "sec"}" data-a="keepgo" ${vp.drop.length ? "" : "disabled"}>Recycle ${vp.drop.length} older version${vp.drop.length === 1 ? "" : "s"}…</button></div>
        <div class="phnote">Active versions are always kept. Recycled files can be restored for 7 days from the log below.</div></div>
      ${vp.stacks.map((l, i) => `<div class="hrow" data-key="vs-${i}"><div><b>${esc(T(l[0]))}</b>${l.map(r => `<div class="hm ${vp.drop.includes(r.name) ? "dis" : ""}">${r.active ? "●" : "○"} ${esc(r.file || r.name)} ${r.version ? `<span class="vchip">${esc(r.version)}</span>` : ""} <span class="phnote">${fmtBytes(r.size)}${vp.drop.includes(r.name) ? " · will be recycled" : ""}</span></div>`).join("")}</div></div>`).join("") || `<div class="phnote">No mod has more than one version installed.</div>`}
      <h3 class="lh">Recycle log <span>${rec.length}</span></h3>${rec.map((e, i) => { const age = (now - (e.t || now)) / 86400;
        return `<div class="hrow" data-key="rc-${i}"><div><b>${esc(e.title || e.name)}</b> <span class="phnote">${fmtBytes(e.size || 0)} · ${esc(rel(e.t))} · ${age < 7 ? `undo available ${Math.ceil(7 - age)} more day(s)` : "older than 7 days"}</span></div>
          <div class="hb"><button class="btn sec" data-a="rcrestore" data-i="${i + 1}">Undo</button></div></div>`; }).join("") || `<div class="phnote">Nothing recycled.</div>`}
      ${rec.some(e => now - (e.t || now) >= 7 * 86400) ? `<button class="btn bad" data-a="rcpurge">Delete files older than 7 days…</button>` : ""}`;
  }
  function compareHTML(g) {
    const names = toArr(g.mods), k = keepOf(names), rs = names.map(byName).filter(Boolean);
    const rowsK = [["File", r => r.file], ["Size", r => fmtBytes(r.size)], ["Version", r => r.version || "—"], ["Updated", r => dt(r.updated || r.modified)], ["Added", r => dt(r.added)], ["Active", r => r.active ? "yes" : "no"], ["Source", r => r.repo ? "Repository" : "Manual"]];
    return `<div class="cmp" data-key="cmp"><span class="close" data-a="dupcmpx">✕</span><h3>Resolve duplicate</h3><div class="phnote">Suggested keep: <b>${esc(modTitle(k.keep))}</b> — ${esc(k.why.join(", "))}</div>
      <div class="cmpg" style="grid-template-columns:110px repeat(${rs.length},1fr)"><span></span>${rs.map(r => `<b class="${r.name === k.keep ? "keep" : ""}">${esc(T(r))}${r.name === k.keep ? " ✓" : ""}</b>`).join("")}
        ${rowsK.map(([l, f]) => `<span class="phnote">${l}</span>${rs.map(r => `<span>${esc(f(r))}</span>`).join("")}`).join("")}
        <span></span>${rs.map(r => `<span><button class="btn ${r.name === k.keep ? "pri" : "sec"}" data-a="dupkeep" data-n="${esc(r.name)}">Keep this</button></span>`).join("")}</div>
      <div class="phnote">“Keep this” moves the other copies to the recycle folder (undo for 7 days).</div></div>`;
  }
  function libConflictsHTML() {
    const conf = toArr(lib.health && lib.health.conflicts);
    return scanHead("Conflicts", "active mods that change the same files") + (conf.slice(0, 80).map((c, i) => `<div class="wcard" data-key="cf-${i}"><div class="wico" title="File conflict">⚠</div><div class="wbody">
        <b>“${esc(modTitle(c.a))}” and “${esc(modTitle(c.b))}” change the same ${c.count} file${c.count > 1 ? "s" : ""}</b>
        <p>Only one version of each file can be used, so one of these mods may look or behave wrong (missing parts, wrong sounds or textures).</p>
        <p class="fix"><span>How to fix:</span> turn one of them off, or keep both if everything works in-game.</p>
        <details><summary>Show the files</summary><div class="phnote">${toArr(c.files).map(esc).join("<br>")}</div></details></div>
        <div class="hb"><button class="btn sec" data-a="lact" data-n="${esc(c.a)}" title="Disable ${esc(modTitle(c.a))}">Turn off first</button><button class="btn sec" data-a="lact" data-n="${esc(c.b)}" title="Disable ${esc(modTitle(c.b))}">Turn off second</button></div></div>`).join("")
      || emptyState("✓", lib.health ? "No conflicts" : "Not checked yet", lib.health ? "None of your active mods change the same files. Nothing to do." : "Press “Scan now” to check your active mods for overlapping files.", lib.health ? null : ["lscan", "Scan now"]));
  }
  function libDepsHTML() {
    const res = byRes(), probs = depProblems(), inact = probs.filter(p => p.status === "inactive");
    const ok = mods().filter(r => toArr(r.reqIds).length && !probs.some(p => p.mod === r.name));
    const cards = probs.map((p, i) => { const m = res.get(+p.id);
      return `<div class="wcard ${p.status}" data-key="dp-${i}"><div class="wico" title="${p.status === "missing" ? "Required mod not installed" : "Required mod turned off"}">${p.status === "missing" ? "✕" : "⛓"}</div><div class="wbody">
        <b>“${esc(modTitle(p.mod))}” needs ${m ? `“${esc(T(m))}”` : "another mod"} to work</b>
        <p>${p.status === "missing" ? "That mod is not installed." : "That mod is installed but turned off."}</p>
        <p class="fix"><span>How to fix:</span> ${p.status === "missing" ? "download it from the repository, or mark it “Not a requirement” if the description only mentions it." : "turn it on."}</p></div>
        <div class="hb">${p.status === "inactive" ? `<button class="btn sec" data-a="lact" data-n="${esc(p.name)}">Turn it on</button>` : `<button class="btn sec" data-a="depfind" data-q="${esc(p.id)}" title="Open the mod page on beamng.com">Find it</button>`}
          <button class="btn ghost" data-a="lnotdep" data-n="${esc(p.mod)}" data-id="${esc(p.id)}" data-v="1" title="Ignore this link from now on">Not a requirement</button></div></div>`; }).join("");
    return `<div class="rhead"><h2>Dependencies</h2><span>${probs.length ? `${probs.length} problem${probs.length === 1 ? "" : "s"}` : "all good"}</span>
        ${inact.length ? `<button class="btn pri" style="margin-left:auto" data-a="depall">Turn on all required (${new Set(inact.map(p => p.name)).size})</button>` : ""}</div>
      ${cards || emptyState("✓", "Every active mod has what it needs", "Marketplace reads “requires …” links in mod descriptions. Nothing is missing right now.")}
      ${ok.length ? `<h3 class="lh">Satisfied <span>${ok.length}</span></h3>${ok.map(r => `<div class="hm" data-key="dok-${esc(r.name)}">✓ <span data-a="ldrawer" data-n="${esc(r.name)}" style="cursor:pointer">${esc(T(r))}</span> <span class="phnote">${toArr(r.reqIds).length} requirement(s)</span></div>`).join("")}` : ""}
      ${(() => { const dis = mods().flatMap(r => toArr(r.reqIds).filter(id => notDep(r.name, id)).map(id => [r, id])); return dis.length ? `<h3 class="lh">Marked “not a requirement” <span>${dis.length}</span></h3>${dis.map(([r, id]) => `<div class="hm" data-key="dnd-${esc(r.name)}-${esc(id)}">${esc(T(r))} → resource #${esc(id)}<span class="clrall" data-a="lnotdep" data-n="${esc(r.name)}" data-id="${esc(id)}" data-v="0">Re-include</span></div>`).join("")}` : ""; })()}`;
  }
  function libBrokenHTML() {
    const b = toArr(lib.data.broken), probs = depProblems();
    return scanHead("Needs attention") + `<h3 class="lh">Overrides game files <span>${b.length}</span></h3><div class="phnote">Reported by the game (core_modmanager.getPossiblyBrokenMods): these mods replace files of the base game and can break after game updates.</div>
      ${b.map((x, i) => `<div class="hrow" data-key="br-${i}"><div><b>${esc(x.mod)}</b> <span class="phnote">${x.files} file(s), e.g. ${esc(x.sample || "")}</span></div></div>`).join("") || `<div class="phnote">${lib.health ? "None." : "Run a scan."}</div>`}
      <h3 class="lh">Missing requirements <span>${probs.length}</span></h3>${probs.map((p, i) => `<div class="hm" data-key="bp-${i}">${esc(modTitle(p.mod))} needs ${esc(p.name ? modTitle(p.name) : "resource #" + p.id)} <span class="phnote">${p.status}</span></div>`).join("") || `<div class="phnote">None.</div>`}`;
  }
  function libUpdatesHTML() {
    const u = lib.upd, q = u.queue || {}, ign = lib.data.ignoreUpd || {};
    const upd = upEntries(), miss = toArr(q.missingList), done = toArr(q.doneList), want = updatable(), run = u.run;
    const row = e => { const d = dl.get(e.id); const pct = d && (d.state === "downloading" || d.state === "installing") ? Math.round((d.progress || 0) * 100) : null;
      const r = mods().find(x => x.tagid === e.id), ignored = ign[e.id], cl = u.log[e.id];
      const down = !want.includes(e) && !ignored && e.state !== "done";
      return `<div class="tl ${ignored ? "ign" : ""} ${e.state === "done" ? "done" : ""}" data-key="u-${esc(e.id)}"><i class="dot"></i><div class="tlb">
        <div class="tlh"><b>${esc(r ? T(r) : e.title || e.modname || e.filename || e.id)}</b> <span class="vchip">${esc(r && r.version || "installed")}</span> → <span class="vchip new">new version</span>
          <span class="phnote">${esc(e.state === "waiting" ? "ready" : e.state || "")}${ignored ? " · ignored" : ""}${down ? " · skipped (not newer)" : ""}</span></div>
        ${pct != null ? `<div class="pbar"><i style="width:${pct}%"></i></div>` : ""}
        ${cl ? `<div class="clog">${cl === "…" ? "Loading what's new…" : esc(cl)}</div>` : ""}
        <div class="tla"><span class="clrall" data-a="updlog" data-id="${esc(e.id)}">${cl ? "Hide what's new" : "What's new?"}</span>
          ${e.state === "waiting" && !ignored && !down ? `<span class="clrall" data-a="updone" data-id="${esc(e.id)}">Update only this</span>` : ""}
          <span class="clrall" data-a="updign" data-id="${esc(e.id)}" data-v="${ignored ? 0 : 1}" title="${ignored ? "Include in Update all again" : "Skip this mod in Update all"}">${ignored ? "Re-include" : "Ignore"}</span></div></div></div>`; };
    const ignoredList = Object.keys(ign);
    return `<div class="uhero" data-key="uhero"><div><b>${run ? `Updating ${run.i} of ${run.ids.length}…` : want.length ? `${want.length} update${want.length === 1 ? "" : "s"} ready` : u.checking ? "Checking your mods…" : q.updatingList ? "Everything is up to date" : "Updates not checked yet"}</b>
        <span>${u.checking ? `${u.checked} mods checked ${esc(u.last)}` : "Updates install one at a time. Ignored mods are skipped and older versions are never installed."}</span>
        ${run ? `<div class="pbar"><i style="width:${(run.i / run.ids.length * 100).toFixed(0)}%"></i></div>` : ""}</div>
        ${run ? `<button class="btn sec" data-a="updcancel">Cancel</button>` : want.length ? `<button class="btn pri big" data-a="updall">Update all (${want.length})</button>` : `<button class="btn pri big" data-a="updcheck" ${u.checking ? "disabled" : ""}>Check for updates</button>`}</div>
      ${want.length && !run ? `<div class="phnote" style="text-align:right"><span class="clrall" data-a="updcheck">Check again</span></div>` : ""}
      <div class="tlw">${upd.map(row).join("") || (q.updatingList ? "" : emptyState("⬆", "No update list yet", "Press “Check for updates”. The game compares your mods with the repository."))}</div>
      ${ignoredList.length ? `<h3 class="lh">Ignored <span>${ignoredList.length}</span></h3>${ignoredList.map(id => { const r = mods().find(x => x.tagid === id); return `<div class="hm" data-key="ig-${esc(id)}">${esc(r ? T(r) : id)}<span class="clrall" data-a="updign" data-id="${esc(id)}" data-v="0">Re-include</span></div>`; }).join("")}` : ""}
      ${miss.length ? `<h3 class="lh">Subscribed but not downloaded <span>${miss.length}</span></h3>${miss.map(row).join("")}<button class="btn sec" data-a="updmissing">Download missing</button>` : ""}
      ${done.length ? `<h3 class="lh">Done <span>${done.length}</span></h3>${done.map(row).join("")}` : ""}
      <div class="phnote">Note: the game's own checker may start downloading the updates it finds by itself.</div>`;
  }
  function libDiskHTML() {
    const d = lib.data.disk || {}, types = toArr(d.byType), big = toArr(d.largest), log = toArr(lib.data.cleanup).slice().reverse();
    const saved = toArr(lib.data.cleanup).reduce((a, e) => a + (+e.size || 0), 0), max = Math.max(1, ...types.map(t => t.size));
    return `<div class="rhead"><h2>Disk</h2></div><div class="dcards"><div><b>${fmtBytes(d.total)}</b><span>${d.count} mods installed</span></div><div><b>${fmtBytes(d.active)}</b><span>${d.activeCount} active</span></div>
        <div><b>${fmtBytes(d.inactive)}</b><span>inactive</span></div><div><b>${fmtBytes(d.recycle)}</b><span>in recycle folder</span></div><div class="save"><b>${fmtBytes(saved)}</b><span>cleaned up so far</span></div></div>
      <h3 class="lh">By type</h3>${types.map(t => `<div class="dbar"><span>${esc(t.type)} (${t.count})</span><div class="pbar"><i style="width:${(t.size / max * 100).toFixed(1)}%"></i></div><b>${fmtBytes(t.size)}</b></div>`).join("")}
      <h3 class="lh">Largest mods</h3>${big.map(m => `<div class="kv"><span>${esc(modTitle(m.name))}${m.active ? "" : " (inactive)"}</span><b>${fmtBytes(m.size)}</b></div>`).join("")}
      <h3 class="lh">Cleanup log <span>${log.length}</span></h3>${log.slice(0, 50).map((e, i) => `<div class="kv" data-key="cl-${i}"><span>${e.act === "deleted" ? "🗑 Deleted" : "♻ Recycled"} ${esc(e.title || "")} <span class="phnote">${esc(rel(e.t))}</span></span><b>${fmtBytes(e.size || 0)}</b></div>`).join("") || `<div class="phnote">Nothing cleaned up yet.</div>`}`;
  }
  function libBackupHTML() {
    return `<div class="rhead"><h2>Backup &amp; restore</h2></div><div class="phnote">Backs up Marketplace's own data — tags, favorites, notes, your ratings, custom names/covers, mod packs, ignored updates and settings. Mod files are not included.</div>
      <div class="lform"><h3>Backup</h3><button class="btn pri" data-a="bkmake">Create backup file</button> <button class="btn sec" data-a="bklist">Show backups</button>
        ${lib.backupPath ? `<div class="phnote">Saved to <b>${esc(lib.backupPath)}</b></div>` : ""}${lib.backupText ? `<textarea class="fi ta" readonly>${esc(lib.backupText)}</textarea>` : ""}
        ${toArr(lib.backups).map(f => `<div class="kv"><span>${esc(f)}</span><b><button class="btn sec" data-a="bkrestore" data-f="${esc(f)}">Restore</button></b></div>`).join("")}</div>
      <div class="lform"><h3>Restore from text</h3><textarea class="fi ta" data-lf="restoreText" placeholder="Paste backup JSON">${esc(lib.restoreText)}</textarea><button class="btn sec" data-a="bkrestoretext">Restore pasted</button></div>`;
  }
  function libSettingsHTML() {
    const s = lib.data.settings || {};
    return `<div class="rhead"><h2>Settings</h2></div><div class="lform">
      <div class="frow"><span>Versions to keep when cleaning up: <b>${+s.keepVersions || 1}</b></span><input type="range" min="1" max="5" data-ls="keepVersions" value="${+s.keepVersions || 1}" style="flex:1"></div>
      <div class="tog ${s.autoCheck !== false ? "on" : ""}" data-a="lsettog" data-k="autoCheck">Check for updates automatically (at game launch and when Mod Manager opens)<i></i></div>
      <div class="phnote">The game's checker may download found updates right away.</div>
      <h4>Parallel downloads</h4><div class="frow"><span>Mods downloaded at the same time</span><div class="seg" data-key="parsel">${[1, 2, 3, 10].map(n => `<span class="${(+lib.data.parallel || 3) === n ? "on" : ""}" data-a="lpar" data-v="${n}">${n}</span>`).join("")}</div></div>
      <div class="phnote">This is the game's own setting (also in Options › User Interface, default 3), used for repository downloads and mod pack imports. It doesn't change BeamMP: the BeamMP launcher always downloads a server's mods one at a time.</div>
      <div class="tog ${perfOn() ? "on" : ""}" data-a="perftog">Performance mode (turns off blur, shadows, animations and hover effects)<i></i></div>
      <div class="tog ${autoHid() ? "on" : ""}" data-a="autotog">Hide Automation exports (cars exported from the Automation game; they have their own category and one Discover shelf)<i></i></div>
      <div class="phnote">Marketplace is already tuned for speed; turn this on if menus still feel slow on your PC.</div>
      <div class="phnote">The background catalog refresh only runs in the main menu. Once a level is loaded Marketplace stays completely idle.</div>
      <h4>Accent colour</h4>${swatchesHTML(accentVal())}
      <h4>Theme</h4><div class="thg">${Object.entries(THEMES).map(([k, t]) => `<div class="thc ${themeKey() === k ? "on" : ""}" data-a="ltheme" data-v="${k}" style="background:${t.v.bg};color:${t.v.tx};border-color:${themeKey() === k ? t.v.acc : t.v.line}">
        <div class="thp"><i style="background:${t.v.s2}"></i><i style="background:${t.v.acc}"></i><i style="background:${t.v.s3}"></i></div><b>${esc(t.name)}</b>${k === "dark-orange" ? `<span>default</span>` : ""}</div>`).join("")}</div></div>
      <div class="phnote">Not available in-game: separate mod storage/hardlinks, launching the game, live telemetry. Driving stats are not read.</div>`;
  }
  function donut(parts, size) {
    const tot = parts.reduce((a, p) => a + p[0], 0) || 1, r = 15.9155; let off = 25;
    return `<svg viewBox="0 0 42 42" width="${size}" height="${size}" class="donut"><circle cx="21" cy="21" r="${r}" fill="none" stroke="var(--s3)" stroke-width="6"></circle>${parts.map(([v, c]) => { const pct = v / tot * 100; const el = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"></circle>`; off -= pct; return el; }).join("")}</svg>`;
  }
  function dashboardHTML() {
    const c = counts(), d = lib.data.disk || {}, act = dl.active(), ov = dl.overall(), h = lib.health || {};
    const tile = (k, ico, val, label, sub, page, tip, tone) => `<div class="dbc ${page ? "lnk" : ""} ${tone || ""}" ${page ? `data-a="lpage" data-k="${page}"` : ""} data-key="db-${k}" title="${esc(tip)}"><i>${ico}</i><b>${val}</b><span>${label}</span>${sub ? `<em>${sub}</em>` : ""}</div>`;
    const types = toArr(d.byType), max = Math.max(1, ...types.map(t => t.size)), COL = ["var(--acc)", "#2f7bff", "#1fae5b", "#a879ff", "#f5c04a", "#14b8c4"];
    const issues = c.updates + c.conflicts + c.duplicates + c.deps;
    return `<div class="rhead"><h2>Dashboard</h2><span>Your mods at a glance. Click a tile to open that section.</span>
        <button class="btn pri" style="margin-left:auto" data-a="lpage" data-k="${issues ? (c.updates ? "updates" : c.deps ? "deps" : c.conflicts ? "conflicts" : "duplicates") : "all"}">${issues ? "Fix the top issue" : "Browse my mods"}</button></div>
      <div class="dbg">${tile("inst", "▤", c.all, "Installed mods", "", "all", "All mods in your mods folder")}${tile("on", "●", c.active, "Enabled", c.all ? Math.round(c.active / c.all * 100) + "% of installed" : "", "active", "Mods the game loads")}
        ${tile("disk", "◔", fmtBytes(d.total), "Disk size", fmtBytes(d.active) + " enabled", "disk", "Space used by all mods")}
        ${tile("upd", "⬆", c.updates, "Pending updates", lib.upd.checking ? `checking… ${lib.upd.checked}` : lib.upd.queue ? "" : "not checked yet", "updates", "Mods with a newer version in the repository", c.updates ? "hot" : "")}
        ${tile("dl", "⬇", act.length, "Active downloads", ov != null ? Math.round(ov * 100) + "% overall" : "idle", null, "Downloads running right now")}
        ${tile("cf", "⚠", c.conflicts, "Conflicts", h.scanning ? "scanning…" : h.scannedAt ? "overlapping files" : "not scanned", "conflicts", "Active mods changing the same files", c.conflicts ? "warn" : "")}
        ${tile("dup", "⧉", c.duplicates, "Duplicates", "", "duplicates", "The same mod installed more than once", c.duplicates ? "warn" : "")}${tile("dep", "⛓", c.deps, "Missing requirements", "", "deps", "Active mods that need another mod", c.deps ? "bad" : "")}</div>
      <div class="dcharts"><div class="dch" data-key="ch1"><h4>Enabled vs disabled</h4><div class="dchr">${donut([[c.active, "var(--acc)"], [c.inactive, "var(--s3)"]], 120)}
          <div class="leg"><div><i style="background:var(--acc)"></i>${c.active} enabled</div><div><i style="background:var(--s3)"></i>${c.inactive} disabled</div></div></div></div>
        <div class="dch" data-key="ch2"><h4>Disk use by type</h4>${types.map((t, i) => `<div class="dbar"><span>${esc(t.type)}</span><div class="pbar"><i style="width:${(t.size / max * 100).toFixed(1)}%;background:${COL[i % COL.length]}"></i></div><b>${fmtBytes(t.size)}</b></div>`).join("") || `<div class="phnote">No data yet.</div>`}</div>
        <div class="dch" data-key="ch3"><h4>Health</h4>${donut([[c.updates, "#1fae5b"], [c.conflicts, "#f5c04a"], [c.duplicates, "#a879ff"], [c.deps, "#ff5d52"], [issues ? 0 : 1, "var(--s3)"]], 120)}
          <div class="leg"><div><i style="background:#1fae5b"></i>${c.updates} updates</div><div><i style="background:#f5c04a"></i>${c.conflicts} conflicts</div><div><i style="background:#a879ff"></i>${c.duplicates} duplicates</div><div><i style="background:#ff5d52"></i>${c.deps} missing</div></div></div></div>
      ${act.length ? `<h3 class="lh">Downloading now</h3>${act.map(dlItem).join("")}` : ""}
      <h3 class="lh">Quick switch mod pack</h3><div class="chips">${toArr(lib.data.loadouts).map(lo => `<span class="chip" data-a="loapply" data-id="${esc(lo.id)}" title="Switch to this mod pack (asks first)">${esc((lo.emoji ? lo.emoji + " " : "") + lo.name)}${lo.alwaysOn ? " 📌" : ""}</span>`).join("") || `<span class="phnote">No mod packs yet — open Mod Packs to save your current mods as one.</span>`}</div>`;
  }
  function sidebarHTML() {
    const c = counts(), los = toArr(lib.data.loadouts), side = lib.side;
    const it = (k, ico, n, cnt, cls) => `<div class="sbi ${lib.page === k ? "on" : ""} ${cls || ""}" data-a="lpage" data-k="${esc(k)}" title="${esc(n)}"><i>${ico}</i>${side ? `<span>${esc(n)}</span>${cnt != null ? `<b class="${cnt && cls ? "hot" : ""}">${cnt}</b>` : ""}` : cnt && cls ? `<em></em>` : ""}</div>`;
    return `<div class="sb ${side ? "" : "mini"}" data-key="sb"><div class="sbt" data-a="lside">${bi(side ? "«" : "»")}</div>
      ${it("dash", "◉", "Dashboard")}${side ? `<h6>Library</h6>` : ""}${it("all", "▤", "Installed", c.all)}${it("active", "●", "Active", c.active)}${it("inactive", "○", "Inactive", c.inactive)}${it("fav", bi("★"), "Favorites", c.fav)}${it("recent", "⟲", "Recently active", c.recent)}
      ${side ? `<h6>Maintenance</h6>` : ""}${it("updates", "⬆", "Updates", c.updates, "w")}${it("duplicates", "⧉", "Duplicates", c.duplicates, "w")}${it("conflicts", "⚠", "Conflicts", c.conflicts, "w")}
      ${it("deps", "⛓", "Dependencies", c.deps, "w")}${it("broken", "✚", "Needs attention", c.broken, "w")}${it("disk", "◔", "Disk")}
      ${side ? `<h6>Mod Packs</h6>` : ""}${it("loadouts", "▣", "All mod packs", los.length)}
      ${los.map(lo => it("lo:" + lo.id, lo.emoji || "▪", lo.name, lo.count)).join("")}
      ${side ? `<h6>More</h6>` : ""}<div class="sbi" data-a="servers" title="BeamMP Servers"><i>🌐</i>${side ? "<span>BeamMP Servers</span>" : ""}</div>
      ${it("backup", "⇅", "Backup & restore")}${it("settings", "⚙", "Settings")}<div class="sbi" data-a="tourstart" title="Show the quick tour again"><i>${bi("?")}</i>${side ? "<span>Quick tour</span>" : ""}</div></div>`;
  }
  const SECTIONS = { dash: ["var(--acc)", "Your mods at a glance."], all: ["#9aa3ae", "Every mod you have. Use the switch to turn a mod on or off; click a name for details."],
    active: ["#3ecf6e", "Mods the game loads right now."], inactive: ["#6f7580", "Installed but turned off. They take disk space but don't load."],
    fav: ["#f5c04a", "Mods you starred."], recent: ["#14b8c4", "Mods you turned on in the last 14 days."], updates: ["#1fae5b", "Newer versions of your repository mods."],
    duplicates: ["#a879ff", "The same mod installed more than once. Keep one, recycle the rest."], conflicts: ["#f5c04a", "Active mods that change the same game files."],
    deps: ["#ff5d52", "Mods that need another mod to work."], broken: ["#ff5d52", "Mods that may break after game updates."], disk: ["#2f7bff", "How much space your mods use."],
    loadouts: ["var(--acc2)", "Saved sets of mods you can switch between in one click."], backup: ["#14b8c4", "Save or restore your tags, notes, ratings and mod packs."], settings: ["#9aa3ae", "Updates, clean-up and look."] };
  const TOUR = [["◉ Dashboard", "Start here: counts, disk use and anything that needs attention. Click a tile to jump to it."],
    ["▤ My mods", "The Installed list is a compact table. Flip the switch to turn a mod on or off. Click a name to see photos, notes and what it needs."],
    ["▣ Mod Packs", "Save the mods you have on now as a mod pack, then switch between sets in one click. 📌 Always On mod packs stay enabled in every switch."],
    ["⬆ Updates", "Check for updates and press “Update all”. Ignored mods are skipped; older versions are never installed."],
    ["⚠ Problems", "Conflicts, Duplicates and Dependencies explain issues in plain words, with a fix button on each card."]];
  function tourHTML() {
    if (lib.tour == null) return "";
    const [t, x] = TOUR[lib.tour];
    return `<div class="tour" data-key="tour"><div class="tbox"><span class="phnote">Quick tour · ${lib.tour + 1} of ${TOUR.length}</span><h3>${esc(t)}</h3><p>${esc(x)}</p>
      <div class="tdots">${TOUR.map((_, i) => `<i class="${i === lib.tour ? "on" : ""}"></i>`).join("")}</div>
      <div class="lobtns">${lib.tour > 0 ? `<button class="btn sec" data-a="tourprev">Back</button>` : ""}<button class="btn pri" data-a="tournext">${lib.tour === TOUR.length - 1 ? "Got it" : "Next"}</button><button class="btn ghost" data-a="tourskip">Skip tour</button></div></div></div>`;
  }
  function tourDone() { lib.tour = null; try { const s = store(); if (s) s.setItem("marketplaceMod.tourDone", "1"); } catch (e) { } } /* ignore */
  const PAGE_TITLES = { all: "Installed mods", active: "Active mods", inactive: "Inactive mods", fav: "Favorites", recent: "Recently active" };
  function libraryHTML() {
    const msg = lib.msg ? `<div class="lmsg ${esc(lib.msg.type)}" data-key="msg">${esc(lib.msg.msg)}<b data-a="lmsgx">×</b></div>` : "";
    if (!lib.data) return `<div class="lib">${msg}<div class="lgrid">${Array.from({ length: 8 }, skCard).join("")}</div></div>`;
    const p = lib.page;
    let body;
    if (p === "dash") body = dashboardHTML();
    else if (p === "loadouts") body = libLoadoutsHTML();
    else if (p.startsWith("lo:")) { const lo = toArr(lib.data.loadouts).find(x => x.id === p.slice(3)); body = libModsHTML(lo ? `${lo.emoji ? lo.emoji + " " : ""}${lo.name}` : "Mod Pack"); }
    else if (p === "updates") body = libUpdatesHTML();
    else if (p === "duplicates") body = libDupHTML();
    else if (p === "conflicts") body = libConflictsHTML();
    else if (p === "deps") body = libDepsHTML();
    else if (p === "broken") body = libBrokenHTML();
    else if (p === "disk") body = libDiskHTML();
    else if (p === "backup") body = libBackupHTML();
    else if (p === "settings") body = libSettingsHTML();
    else body = libModsHTML(PAGE_TITLES[p] || "Mod Manager");
    const sk = p.startsWith("lo:") ? "loadouts" : p, sec = SECTIONS[sk] || SECTIONS.all;
    return `<div class="mm ${lib.side ? "" : "mini"} ${lib.drawer ? "hasdrw" : ""}">${sidebarHTML()}<div class="mmain sec-${esc(sk)}" style="--sec:${sec[0]}">${msg}<div class="hint" data-key="hint-${esc(sk)}">${esc(sec[1])}</div>${body}</div>${drawerHTML()}</div>${tourHTML()}`;
  }

  // ---- BeamMP servers ----
  const MP_URL = "https://backend.beammp.com/servers-info";
  const stripCodes = s => String(s || "").replace(/\^[0-9a-flormnpA-FLORMNP]/g, "");
  const mapName = m => { const x = /\/levels\/([^/]+)\//.exec(String(m || "")); return x ? x[1] : String(m || "unknown"); };
  const splitL = (s, sep) => String(s || "").split(sep).map(x => x.trim()).filter(Boolean);
  const modNames = l => splitL(l, ";").map(p => p.replace(/\\/g, "/").split("/").pop().replace(/\.zip$/i, ""));
  function installedNameSet() {
    const set = new Set();
    for (const r of toArr(lib.data && lib.data.mods)) { set.add(String(r.name).toLowerCase()); if (r.file) set.add(String(r.file).toLowerCase().replace(/\.zip$/, "")); }
    return set;
  }
  // JS fallback (used only if the game's HTTP client can't fetch the list): same shape as marketplaceModBeamMP.lua
  function slimServer(s, inst) {
    const names = modNames(s.modlist);
    return { key: `${s.ip}:${s.port}`, name: stripCodes(s.sname), map: mapName(s.map), tags: splitL(s.tags, ","), players: +s.players || 0, max: +s.maxplayers || 0,
      loc: String(s.location || ""), version: s.version, mods: +s.modstotal || names.length, modsSize: +s.modstotalsize || 0,
      have: names.filter(n => inst.has(n.toLowerCase())).length, password: s.password === true, official: s.official === true,
      featured: s.featured === true, partner: s.partner === true, owner: s.owner };
  }
  function serverDetailJS(key) {
    const s = toArr(mp.raw).find(x => `${x.ip}:${x.port}` === key); if (!s) return null;
    const inst = installedNameSet(), d = slimServer(s, inst);
    d.desc = stripCodes(s.sdesc); d.playerList = splitL(s.playerslist, ";"); d.ip = s.ip; d.port = s.port;
    d.modList = modNames(s.modlist).map(n => ({ name: n, have: inst.has(n.toLowerCase()) }));
    return d;
  }
  function acceptRawServers(list) {
    const raw = toArr(list).filter(s => s && s.ip && s.port);
    if (!raw.length) return false;
    mp.raw = raw; mp.src = "js"; mp.err = null;
    const inst = installedNameSet();
    mp.data = { servers: raw.map(s => slimServer(s, inst)), fetchedAt: Date.now() / 1000, fav: (mp.data && mp.data.fav) || mp.prefs.fav || {}, recent: (mp.data && mp.data.recent) || mp.prefs.recent || [] };
    return true;
  }
  function fetchServersJS() {
    if (mp.fetchTried || typeof win.fetch !== "function") return;
    mp.fetchTried = true;
    win.fetch(MP_URL).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(list => {
      if (acceptRawServers(list)) render(false);
    }).catch(e => { mp.fetchErr = String(e && e.message || e); });
  }
  function serversFailed() {
    if (mp.data) return;
    mp.err = mp.err || "Couldn't load the BeamMP server list.";
    if (st.view === "servers" && isOpen()) render(false);
  }
  function retryServers() {
    mp.err = null; mp.fetchErr = null; mp.fetchTried = false; mp.data = null;
    startServerRefresh(true); render(false);
  }
  function mpRows() {
    const d = mp.data; if (!d) return [];
    const fav = d.fav || {}, recent = toArr(d.recent), q = mp.q.trim().toLowerCase(), maxB = mp.maxMB === "" ? null : +mp.maxMB * 1048576;
    let rows = toArr(d.servers).filter(s => {
      if (mp.show === "fav" && !fav[s.key]) return false;
      if (mp.show === "recent" && !recent.includes(s.key)) return false;
      if (mp.country && s.loc !== mp.country) return false;
      if (mp.map && s.map !== mp.map) return false;
      if (mp.free && s.players >= s.max) return false;
      if (mp.tag && !toArr(s.tags).includes(mp.tag)) return false;
      if (maxB != null && !isNaN(maxB) && s.modsSize > maxB) return false;
      if (q && !`${s.name} ${s.map} ${toArr(s.tags).join(" ")} ${s.owner || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const k = mp.sort, dir = mp.dir;
    const val = s => k === "name" ? s.name.toLowerCase() : k === "map" ? s.map : k === "loc" ? s.loc : k === "mods" ? s.modsSize : k === "have" ? (s.mods ? s.have / s.mods : 1) : s.players;
    rows.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * dir || b.players - a.players; });
    if (mp.show === "recent") rows.sort((a, b) => recent.indexOf(a.key) - recent.indexOf(b.key));
    return rows;
  }
  const flag = cc => /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🌐";
  function startJoin(key) {
    if (!key) return;
    const s = toArr(mp.data && mp.data.servers).find(x => x.key === key) || mp.detail || {};
    const raw = toArr(mp.raw).find(r => r && r.ip + ":" + r.port === key); // the list lives here, Lua may not have it
    mp.join = { key, addr: key, name: s.name || key, sname: (raw && raw.sname) || s.name || "", phase: "checking", status: "", mods: [], t: Date.now(),
      size: s.modsSize || 0, count: s.mods || 0, keep: keepOn(key), min: joinMinPref(), got: {}, idx: 0, total: 0 };
    const busy = dl.active().length; // repository downloads share the connection with BeamMP's
    if (busy) mp.join.note = busy + " repository download" + (busy > 1 ? "s are" : " is") + " still running; they share your connection with BeamMP's downloads.";
    mpCall("uiJoinState"); render(false);
  }
  const DL_ACTIONS = new Set(["sub", "retry", "retrypack", "retryall", "pkok", "lsubmiss", "lsubmissall", "updone", "updall", "updmissing"]);
  const joinActive = () => { const j = mp.join; return !!j && (j.phase === "sent" || j.phase === "connecting"); };
  function joinMinPref() { try { const s0 = store(); return !!s0 && s0.getItem("marketplaceMod.joinMin") === "1"; } catch (e) { return false; } }
  function keepOn(key) { const k = (mp.prefs && mp.prefs.keep) || (mp.data && mp.data.keep) || {}; return !!k[key]; }
  function setKeep(key, on) {
    mp.prefs = mp.prefs || { fav: {}, recent: [] }; const k = mp.prefs.keep || (mp.prefs.keep = {});
    on ? k[key] = true : delete k[key];
    if (mp.data && mp.data.keep && mp.data.keep !== k) { on ? mp.data.keep[key] = true : delete mp.data.keep[key]; }
    mpCall("uiServerKeep", key, !!on);
  }
  const pillMode = j => !!j && j.min && (j.phase === "sent" || j.phase === "connecting") && !j.prompt;
  function joinOverall(j) {
    if (!j.total) return j.done ? 100 : null;
    const cur = j.mods[0], frac = cur && cur.pct < 100 && !cur.cached ? cur.pct / 100 : 1;
    return Math.max(0, Math.min(100, ((Math.max(1, j.idx) - 1) + frac) / j.total * 100));
  }
  function joinCounts(j) { const v = Object.values(j.got || {}); return { cache: v.filter(x => x === "cache").length, dl: v.filter(x => x === "dl").length }; }
  function pillHTML() {
    const j = mp.join; if (!pillMode(j)) return "";
    const cur = j.mods[0], ov = joinOverall(j);
    const line = cur && !j.done ? `${cur.num} · ${cur.name}${cur.cached ? " · from BeamMP's cache" : " · " + cur.pct.toFixed(0) + "%" + (cur.speed ? " · " + cur.speed : "")}`
      : (j.status || "Connecting…");
    return `<div class="jpt"><b>${j.done ? "Loading " : "Joining "}${esc(j.name)}${ov != null && !j.done ? ` · ${Math.floor(ov)}%` : ""}</b><span title="${esc(line)}">${esc(line)}</span>${j.slow ? `<span>No word from BeamMP for a while (the launcher window shows details)</span>` : ""}</div>
      <div class="mpjbar"><i style="width:${ov == null ? 0 : ov.toFixed(1)}%"></i></div>
      <div class="jpb"><span class="jpk ${j.keep ? "on" : ""}" data-a="mpjkeep" title="Save a permanent copy of this server's mods as a Mod Pack (Mod Manager › Mod Packs)">${j.keep ? "✓ " : ""}Keep mods</span>
        <button class="btn sec" data-a="mpjmax" title="Show the join window">⤢ Details</button><button class="btn sec" data-a="mpjcancel">Cancel</button></div>`;
  }
  let lastPill = null;
  function renderPill() {
    const el = root.querySelector("#rfm-pill"); if (!el) return;
    const h = pillHTML();
    if (h === lastPill) return;
    lastPill = h; el.innerHTML = iconize(h); el.hidden = !h;
  }
  // progress while minimized only repaints the pill (BeamMP sends LoadingInfo 10 times a second)
  const pillOnly = j => { if (pillMode(j)) { renderPill(); return true; } return false; };
  function joinDone(j) {
    j.done = true; j.mods.forEach(x => { x.pct = 100; });
    const c = joinCounts(j);
    if (c.cache || c.dl) mpCall("uiJoinLog", `server mods ready: ${c.cache} from BeamMP's cache, ${c.dl} downloaded`);
    j.status = "Mods ready" + (c.cache || c.dl ? ` (${c.cache} from BeamMP's cache, ${c.dl} downloaded)` : "") + " · loading the map…";
    if (j.keep && !j.saving) { j.saving = true; mpCall("uiServerSave", j.key, j.sname || j.name || ""); }
    win.clearTimeout(mp.doneT);
    mp.doneT = win.setTimeout(() => { if (mp.join === j && isOpen()) close(true); }, 1500);
  }
  function joinNow() {
    const j = mp.join; if (!j) return;
    j.phase = "sent"; j.t = Date.now(); j.status = ""; j.mods = []; j.prompt = false; j.slow = false; j.lastLog = ""; j.got = {}; j.idx = 0; j.total = 0; j.done = false; j.saving = false; mpCall("uiJoin", j.key, j.sname || j.name || ""); render(false);
  }
  function onJoinState(d) {
    const j = mp.join; if (!j) return false;
    if (d.launcher != null) mp.launcher = !!d.launcher;
    if (d.query) {
      if (j.phase !== "checking") return false;
      if (d.beammp && d.launcher && (d.inLevel || d.inSession)) {
        j.phase = "confirm";
        ask("Join " + j.name + "?", d.inSession ? "You'll leave the BeamMP server you're on now." : "You're in a level. Unsaved progress in it will be lost when BeamMP loads the server's map.",
          "Join server", () => { joinNow(); }, false);
        const c = st.confirm; if (c) { const no = () => { if (mp.join === j) mp.join = null; }; c.cancel = no; }
        return false;
      }
      joinNow(); return false;
    }
    if (d.addr) j.addr = d.addr;
    if (d.name) j.name = d.name;
    if (d.state === "connecting") { j.phase = "connecting"; j.status = j.status || "Asking the BeamMP launcher to connect…"; j.t = Date.now(); armJoinWatch(); if (j.min) renderPill(); }
    else if (d.state === "login") { j.phase = "login"; j.msg = d.msg || "Sign in to BeamMP first."; } // BeamMP isn't signed in
    else { j.phase = "failed"; j.kind = d.state; j.msg = d.msg || "BeamMP can't join right now."; j.copied = !!d.copied;
      notify("error", j.msg + (d.copied ? " Address " + j.addr + " copied." : "")); }
    return false;
  }
  function joinRefused(reason, unreachable) {
    const j = mp.join; if (!j) return;
    win.clearTimeout(mp.joinT);
    const r = String(reason || "").trim();
    j.needLogin = !unreachable && /invalid key|not logged|guest/i.test(r);
    j.phase = "failed"; j.kind = "refused";
    j.msg = unreachable // the launcher couldn't open a connection at all
      ? "Couldn't reach this server (BeamMP: \u201c" + (r || "Connection Failed!") + "\u201d). It may be offline, restarting or not accepting connections right now. Try another server."
      : (r ? "The server refused the connection: \u201c" + r + "\u201d." : "The server refused the connection.") +
      (j.needLogin ? " BeamMP isn't signed in, not even as a guest. Sign in as a guest here, or log in to your account in BeamMP's multiplayer menu, then join again." : "");
    mpCall("uiJoinLog", "server refused " + j.addr + ": " + (r || "(no reason)"));
    mpCall("uiJoinCancel", "server refused: " + (r || "no reason"));
    notify("error", j.msg);
  }
  function guestJoin() {
    const j = mp.join; if (!j) return;
    j.phase = "loggingIn"; j.t = Date.now(); j.needLogin = false;
    mpCall("uiJoinGuest"); render(false);
    win.clearTimeout(mp.joinT);
    mp.joinT = win.setTimeout(() => { const k = mp.join; if (k === j && k.phase === "loggingIn") {
      k.phase = "failed"; k.kind = "login"; k.needLogin = true; k.msg = "BeamMP didn't answer the guest sign-in. Sign in from BeamMP's multiplayer menu, then join again.";
      mpCall("uiJoinLog", "guest sign-in: no answer after 20 s"); render(false); } }, 20000);
  }
  function onLoggedIn() {
    const j = mp.join; if (!j || j.phase !== "loggingIn") return true;
    win.clearTimeout(mp.joinT); mpCall("uiJoinLog", "BeamMP signed in (onBeamMPLoggedIn), joining " + j.addr + " in 1.5 s");
    j.status = "Signed in · joining…";
    mp.joinT = win.setTimeout(() => { if (mp.join === j && j.phase === "loggingIn") joinNow(); }, 1500);
    return false;
  }
  function onLoginError(d) {
    const j = mp.join; if (!j || j.phase !== "loggingIn") return true;
    win.clearTimeout(mp.joinT);
    const r = (typeof d === "string" ? d : String((d && d.message) || "")).trim();
    j.phase = "failed"; j.kind = "login"; j.needLogin = true;
    j.msg = "BeamMP sign-in failed" + (r ? ": " + r : ".") + " Try again, or sign in from BeamMP's multiplayer menu.";
    mpCall("uiJoinLog", "guest sign-in failed (onBeamMPLoginError): " + (r || "(no message)"));
    return false;
  }
  function armJoinWatch() {
    win.clearTimeout(mp.joinT);
    mp.joinT = win.setTimeout(() => { const j = mp.join; if (j && j.phase === "connecting" && Date.now() - j.t >= 44000) { j.slow = true; mpCall("uiJoinLog", "no word from BeamMP for 45 s (last: " + (j.status || "-") + ")"); render(false); } }, 45000);
  }
  const DL_RE = /Downloading Resource (\d+\/\d+): (.+?) \((\d+(?:\.\d+)?)%\)(?: at (.+))?/;
  const LOAD_RE = /^Loading Resource (\d+)\/(\d+): (.+)$/;
  function onJoinLoading(d) {
    const j = mp.join; if (!j || (j.phase !== "connecting" && j.phase !== "sent")) return true;
    const msg = String((d && d.message) || "").trim(); if (!msg) return true;
    j.t = Date.now(); j.slow = false; armJoinWatch();
    const m = DL_RE.exec(msg);
    if (!m && msg !== j.lastLog) { j.lastLog = msg; mpCall("uiJoinLog", "BeamMP LoadingInfo: " + msg); }
    const bad = /^Disconnected:\s*(.*)$/i.exec(msg), unreach = /^(Connection Failed.*)$/i.exec(msg);
    if (bad || unreach) { joinRefused((bad || unreach)[1], !!unreach); return false; }
    if (msg === "start") { j.status = "Connecting to the server…"; return pillOnly(j); }
    if (m) { const [, num, name, pct, speed] = m; const e = j.mods.find(x => x.name === name);
      const nn = num.split("/"); j.idx = +nn[0] || j.idx; j.total = +nn[1] || j.total; j.got[name] = "dl";
      if (e) { e.pct = +pct; e.speed = speed || ""; e.cached = false; } else { j.mods.unshift({ num, name, pct: +pct, speed: speed || "" }); mpCall("uiJoinLog", "downloading " + num + ": " + name); }
      j.status = "Downloading server mods…"; return pillOnly(j); }
    const lm = LOAD_RE.exec(msg);
    if (lm) { const [, n1, n2, name] = lm; j.idx = +n1; j.total = +n2;
      if (!j.got[name]) { j.got[name] = "cache"; j.mods.unshift({ num: n1 + "/" + n2, name, pct: 100, speed: "", cached: true }); }
      const c = joinCounts(j); j.status = `Server mods ${n1}/${n2}` + (c.cache ? ` · ${c.cache} from BeamMP's cache` : "");
      return pillOnly(j); }
    if (msg === "done") { joinDone(j); return pillOnly(j); }
    j.status = msg;
    return pillOnly(j);
  }
  function onJoinPrompt() {
    const j = mp.join; if (!j || j.phase !== "connecting") return true; // BeamMP's own menu handles joins it started
    j.prompt = true; mpCall("uiJoinLog", "BeamMP asks before downloading server mods"); return false;
  }
  function onJoined() {
    const j = mp.join; if (!j) return true;
    mp.join = null; win.clearTimeout(mp.joinT); win.clearTimeout(mp.doneT); renderPill(); notify("info", "Joined " + j.name); mpCall("uiJoinDone", "joined " + j.addr + " (onBeamMPServerJoined)");
    if (isOpen()) close(true);
    return true;
  }
  function onJoinLost() {
    mp.launcher = false; const j = mp.join; if (!j || j.phase === "failed") return false;
    j.phase = "failed"; j.kind = "lost"; j.msg = "Lost the connection to the BeamMP launcher."; mpCall("uiJoinDone", "launcher connection lost during join"); return false;
  }
  function joinHTML() {
    const j = mp.join; if (!j || j.phase === "confirm") return "";
    const head = `<h3>${j.phase === "failed" ? (j.kind === "refused" ? "Couldn't join " + esc(j.name) : "Can't join from here") : j.phase === "login" || j.phase === "loggingIn" ? "Sign in to BeamMP to join" : "Joining " + esc(j.name)}</h3><div class="ca">${esc(j.addr)}</div>`;
    const guestBtn = `<button class="btn pri" data-a="mpjguest">Sign in as guest &amp; join</button>`;
    if (j.phase === "login") return `<div class="modal" data-key="mpjoin"><div class="mbox">${head}
      <div class="mpred" style="margin:12px 0"><div class="ico">⚠</div><div><p>${esc(j.msg)}</p><p class="why">BeamMP's own server browser asks for the same sign-in before it lets you join.</p></div></div>
      <div class="lobtns">${guestBtn}<button class="btn sec" data-a="mpjcopy">Copy address</button><button class="btn sec" data-a="mpjcancel">Cancel</button></div></div></div>`;
    if (j.phase === "loggingIn") return `<div class="modal" data-key="mpjoin"><div class="mbox">${head}
      <div class="phnote" style="margin:10px 0">Signing in to BeamMP as a guest…</div>
      <div class="lobtns"><button class="btn sec" data-a="mpjcancel">Cancel</button></div></div></div>`;
    if (j.phase === "failed") return `<div class="modal" data-key="mpjoin"><div class="mbox">${head}
      <div class="mpred" style="margin:12px 0"><div class="ico">⚠</div><div><p>${esc(j.msg)}</p>${j.copied ? `<p class="why">The address was copied, so you can paste it into BeamMP's Direct Connect.</p>` : ""}</div></div>
      <div class="lobtns">${j.needLogin ? guestBtn : ""}<button class="btn sec" data-a="mpjcopy">Copy ${esc(j.addr)}</button>${j.kind === "unavailable" || j.kind === "lost" ? `<button class="btn sec" data-a="mpsite">Get BeamMP launcher</button>` : ""}<button class="btn ${j.needLogin ? "sec" : "pri"}" data-a="mpjcancel">OK</button></div></div></div>`;
    if (j.prompt) return `<div class="modal" data-key="mpjoin"><div class="mbox">${head}
      <h4>This server uses mods</h4><div class="phnote" style="white-space:pre-wrap">BeamMP will download this server's mods and run them in your game while you play on it. Only continue if you trust the server.</div>
      <div class="lobtns"><button class="btn pri" data-a="mpjyes">Download mods &amp; join</button><button class="btn sec" data-a="mpjno">Don't download</button></div></div></div>`;
    if (pillMode(j)) return "";
    const cur = j.mods[0], ov = joinOverall(j);
    return `<div class="modal" data-key="mpjoin"><div class="mbox">${head}
      <div class="phnote" style="margin:10px 0">${esc(j.status || "Connecting…")}</div>
      ${j.mods.length ? `<div class="mpjmods">${j.mods.slice(0, 6).map((m, i) => `<div class="hm">${i > 0 || m.pct >= 100 ? "✓" : "↓"} ${esc(m.num)} · ${esc(m.name)} <span class="phnote">${m.cached ? "from BeamMP's cache" : i === 0 && m.pct < 100 ? esc(m.pct.toFixed(0) + "%" + (m.speed ? " · " + m.speed : "")) : "done"}</span></div>`).join("")}
        ${cur && cur.pct < 100 ? `<div class="mpjbar"><i style="width:${Math.max(0, Math.min(100, cur.pct))}%"></i></div>` : ""}</div>` : ""}
      ${ov != null && j.total ? `<div class="phnote">All server mods: ${Math.floor(ov)}% (${Math.min(j.idx, j.total)} of ${j.total})</div><div class="mpjbar"><i style="width:${ov.toFixed(1)}%"></i></div>` : ""}
      ${j.slow ? `<div class="phnote">No word from BeamMP for a while. It may still be working; the launcher window shows details.</div>` : ""}
      ${j.note ? `<div class="phnote">${esc(j.note)}</div>` : ""}
      <div class="tog ${j.keep ? "on" : ""}" data-a="mpjkeep" title="Mod Manager › Mod Packs › Saved server mods">Keep this server's mods as a Mod Pack${j.size ? " (about " + fmtBytes(j.size) + " of disk space)" : ""}<i></i></div>
      <div class="phnote">BeamMP downloads one mod at a time and reuses its own cache when you rejoin. You can keep using Marketplace meanwhile: minimize this window.</div>
      <div class="lobtns"><button class="btn pri" data-a="mpjmin" title="Shows a small progress bar on every Marketplace page">▾ Minimize · keep browsing</button><button class="btn sec" data-a="mpjcopy">Copy address</button><button class="btn sec" data-a="mpjcancel">Cancel</button></div></div></div>`;
  }
  function serversHTML() {
    const d = mp.data;
    const hasList = d && toArr(d.servers).length;
    const red = !hasList ? `<div class="mpred" data-key="mpred" role="alert"><div class="ico">⚠</div><div>
        <h3>${mp.err ? "Couldn't load the BeamMP server list" : "BeamMP server list not available yet"}</h3>
        <p>The server list only works when BeamNG is started through the BeamMP launcher.</p>
        <p class="why">${mp.launcher === false && !/launcher/i.test(mp.err || "") ? "The BeamMP launcher is not connected. " : ""}${mp.err ? esc(mp.err) : "Waiting for the list…"}${mp.fetchErr ? " · Direct download: " + esc(mp.fetchErr) : ""}</p>
        ${mp.err ? `<button class="btn" data-a="mpretry">↻ Retry</button>` : ""}</div></div>` : "";
    if (!d && mp.err) return `<div class="rhead"><h2>BeamMP servers</h2></div>${red}`;
    if (!d) return `<div class="rhead"><h2>BeamMP servers</h2><span>Loading the public server list…</span></div>${red}${Array.from({ length: 8 }, () => `<div class="sk" style="height:38px;margin:6px 0;border-radius:var(--r1)"></div>`).join("")}`;
    const all = toArr(d.servers), rows = mpRows(), fav = d.fav || {};
    const top = (f, n) => Object.entries(all.reduce((m, s) => (m[f(s)] = (m[f(s)] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]).filter(Boolean);
    const sel = (k, list, label) => `<div class="chips"><span class="lbl">${label}</span><span class="chip ${!mp[k] ? "on" : ""}" data-a="mpset" data-k="${k}" data-v="">Any</span>${list.map(v => `<span class="chip ${mp[k] === v ? "on" : ""}" data-a="mpset" data-k="${k}" data-v="${esc(v)}">${k === "country" ? flag(v) + " " : ""}${esc(v)}</span>`).join("")}</div>`;
    const th = (k, n) => `<th data-a="mpsort" data-k="${k}">${n}${mp.sort === k ? (mp.dir < 0 ? " ▾" : " ▴") : ""}</th>`;
    const players = all.reduce((a, s) => a + s.players, 0);
    const det = mp.detail;
    return `${red}<div class="rhead"><h2>BeamMP servers</h2><span>${all.length.toLocaleString("en-US")} servers · ${players.toLocaleString("en-US")} players online${d.fetchedAt ? " · updated " + rel(d.fetchedAt) : ""}${d.error ? " · " + esc(d.error) : ""}</span></div>
      <div class="phnote">Public list from BeamMP. <b>Join</b> connects through BeamMP itself (the game must be started with the BeamMP launcher); BeamMP downloads the server's mods, Marketplace never does.</div>
      <div class="ltools"><input class="fi lq" data-mf="q" placeholder="Search name, map, tag, owner…" value="${esc(mp.q)}">
        <div class="chips">${[["all", "All"], ["fav", "★ Favorites"], ["recent", "Recent"]].map(([k, n]) => `<span class="chip ${mp.show === k ? "on" : ""}" data-a="mpset" data-k="show" data-v="${k}">${n}</span>`).join("")}
          <span class="chip ${mp.free ? "on" : ""}" data-a="mpfree">Has free slots</span><span class="lbl">Max mod size (MB)</span><input class="fi" style="width:80px" type="number" min="0" data-mf="maxMB" value="${esc(mp.maxMB)}"></div>
        ${sel("country", top(s => s.loc, 12), "Country")}${sel("map", top(s => s.map, 12), "Map")}${sel("tag", top(s => toArr(s.tags)[0] || "", 10), "Tag")}</div>
      <div class="mpwrap"><table class="mpt"><thead><tr><th></th>${th("name", "Server")}${th("players", "Players")}${th("map", "Map")}${th("loc", "Loc")}${th("mods", "Mods")}${th("have", "You have")}</tr></thead>
        <tbody>${rows.slice(0, mp.limit).map(s => `<tr data-key="s-${esc(s.key)}" class="${det && det.key === s.key ? "on" : ""}" data-a="mpdetail" data-k="${esc(s.key)}">
          <td><span class="lfav ${fav[s.key] ? "on" : ""}" data-a="mpfav" data-k="${esc(s.key)}">${bi(fav[s.key] ? "★" : "☆")}</span></td>
          <td class="sn">${s.official ? `<span class="badge-s">OFFICIAL</span>` : s.partner ? `<span class="badge-s">PARTNER</span>` : ""}${s.password ? "🔒 " : ""}${esc(s.name)}</td>
          <td>${s.players}/${s.max}</td><td>${esc(s.map)}</td><td>${flag(s.loc)} ${esc(s.loc)}</td>
          <td>${s.mods ? `${s.mods} · ${fmtBytes(s.modsSize)}` : "—"}</td><td>${s.mods ? `${s.have}/${s.mods}` : "—"}</td></tr>`).join("")}</tbody></table>
        ${rows.length > mp.limit ? `<div class="more"><button class="btn sec" data-a="mpmore">Show more (${rows.length - mp.limit} left)</button></div>` : ""}
        ${!rows.length ? `<div class="empty"><b>No servers match</b>Try fewer filters.</div>` : ""}</div>
      ${det ? `<div class="mpdet" data-key="mpdet"><span class="close" data-a="mpclose">✕</span><h3>${esc(det.name)}</h3>
        <div class="ca">${flag(det.loc)} ${esc(det.loc)} · ${esc(det.map)} · ${det.players}/${det.max} players · BeamMP ${esc(det.version || "?")}${det.owner ? " · by " + esc(det.owner) : ""}</div>
        ${det.desc ? `<div class="descb">${esc(det.desc)}</div>` : ""}
        <div class="lobtns"><button class="btn pri" data-a="mpjoin" data-k="${esc(det.key)}" title="${mp.launcher === false ? "The BeamMP launcher isn't connected: this copies the address instead" : "Join through BeamMP (it downloads the server's mods and loads the map)"}">▶ Join server</button>
          <button class="btn sec" data-a="mpcopy" data-v="${esc(det.ip + ":" + det.port)}">Copy ${esc(det.ip + ":" + det.port)}</button>
          ${mp.launcher === false ? `<button class="btn sec" data-a="mpsite">Get BeamMP launcher</button>` : ""}<button class="btn sec" data-a="mpfav" data-k="${esc(det.key)}">${fav[det.key] ? bi("★") + " Favorited" : bi("☆") + " Favorite"}</button></div>
        <div class="tog ${keepOn(det.key) ? "on" : ""}" data-a="mpkeep" data-k="${esc(det.key)}" title="Saved in Mod Manager › Mod Packs › Saved server mods">Keep this server's mods as a Mod Pack every time I join from Marketplace${det.modsSize ? " (" + fmtBytes(det.modsSize) + ")" : ""}<i></i></div>
        <h4>Players (${toArr(det.playerList).length})</h4><div class="ltags">${toArr(det.playerList).map(p => `<span class="ltag">${esc(p)}</span>`).join("") || `<span class="phnote">Empty</span>`}</div>
        <h4>Required mods — you already have ${det.have}/${det.mods} (${fmtBytes(det.modsSize)} total)</h4>
        ${toArr(det.modList).map(m => `<div class="hm">${m.have ? "✓" : "○"} ${esc(m.name)}</div>`).join("") || `<div class="phnote">No mods required.</div>`}
        <div class="phnote">BeamMP's launcher downloads server mods when you join. “You have” matches installed mod file names.</div></div>` : ""}`;
  }
  function startServerRefresh(force) {
    stopServerRefresh();
    win.clearTimeout(mp.failT);
    mpCall("uiServers", force ? true : undefined);
    mp.timer = win.setInterval(() => { if (st.view === "servers" && isOpen()) { if (!mp.join) mpCall("uiServers"); } else stopServerRefresh(); }, 60000); // no list request ('B' resets the launcher) while joining
    // fall back to fetch() if the game's HTTP client hasn't answered in 8 s
    win.setTimeout(() => { if (!mp.data && st.view === "servers") fetchServersJS(); }, 8000);
    // never spin forever: show an error with Retry after 25 s without a list
    mp.failT = win.setTimeout(serversFailed, 25000);
  }
  function stopServerRefresh() { if (mp.timer) { win.clearInterval(mp.timer); mp.timer = null; } }

  // requirement counts of items we have shown (cards / detail)
  function reqCountOf(id) {
    const d = st.detail; if (d && d.item && String(d.item.id) === String(id)) return toArr(d.requirements).filter(r => !r.installed).length || (d.item.requires || 0);
    const t = st.reqs.get(String(id)); return t || 0;
  }
  function subscribeNow(ids) {
    for (const i of ids) { st.subscribed.add(i); dl.update([{ id: i, state: "queued", retry: true }]); }
    if (ids.length === 1) call("uiSubscribe", JSON.stringify(ids[0])); else call("uiSubscribeMany", toLua(ids));
    render(false);
  }
  // ask first: Install all (primary) / Just this mod / Cancel — nothing extra without "Install all"
  function showInstallPlan(d) {
    const miss = toArr(d.missing);
    if (!miss.length) { subscribeNow([d.id]); return; }
    const auto = miss.filter(r => r.tagid), manual = miss.filter(r => !r.tagid);
    const lines = [`“${d.title}” needs ${miss.length} other mod${miss.length > 1 ? "s" : ""} that you don't have:`, "",
      ...miss.map(r => `• ${r.title || "Resource #" + r.resourceId}${r.size ? " — " + fmtSize(r.size) : ""}${r.tagid ? "" : " (open its page on beamng.com to get it)"}`)];
    if (manual.length && auto.length) lines.push("", "“Install all” adds the ones that can be installed automatically.");
    st.confirm = { title: "This mod needs other mods", text: lines.join("\n"), ok: auto.length ? "Install all" : "Install this mod", alt: auto.length ? "Just this mod" : null,
      run: () => subscribeNow([d.id, ...auto.map(r => r.tagid)]), runAlt: () => subscribeNow([d.id]) };
    render(false);
  }
  function welcomeHTML() {
    if (!st.welcome) return "";
    return `<div class="modal" data-key="welcome"><div class="mbox welbox"><span class="phnote">Welcome to Marketplace</span><h3>Pick your accent colour</h3>
      <div class="phnote">Changes apply right away, so the whole screen is the preview. You can change it later in Mod Manager › Settings.</div>
      ${swatchesHTML(accentVal())}
      <div class="welprev"><button class="btn pri">Subscribe</button><span class="chip on">Selected</span><span class="badge b-current" style="position:static">✓ 0.38</span><span class="tabx">Discover</span><div class="pbar"><i></i></div></div>
      <div class="lobtns"><button class="btn pri" data-a="welok">Done</button><button class="btn sec" data-a="welskip">Keep default</button></div></div></div>`;
  }
  function confirmHTML() {
    const c = st.confirm; if (!c) return "";
    return `<div class="modal" data-key="modal"><div class="mbox"><h3>${esc(c.title)}</h3><div class="phnote" style="white-space:pre-wrap">${esc(c.text)}</div>
      <div class="lobtns"><button class="btn ${c.danger ? "bad" : "pri"}" data-a="cfyes">${esc(c.ok || "Confirm")}</button>${c.alt ? `<button class="btn sec" data-a="cfalt">${esc(c.alt)}</button>` : ""}<button class="btn sec" data-a="cfno">Cancel</button></div></div></div>`;
  }
  function ask(title, text, ok, run, danger, alt, runAlt) { st.confirm = { title, text, ok, run, danger, alt, runAlt }; render(false); }
  const loById = id => toArr(lib.data && lib.data.loadouts).find(x => x.id === id);
  // pre-launch check result -> confirmation
  function showLoadoutCheck(d) {
    const lo = loById(d.id), p = d.plan; if (!p) { lib.msg = { type: "error", msg: d.error || "Mod Pack not found" }; return; }
    const deps = toArr(p.deps), inact = deps.filter(x => x.status === "inactive"), miss = deps.filter(x => x.status === "missing");
    const lines = [`${toArr(p.activate).length} mod(s) will be enabled, ${toArr(p.deactivate).length} disabled.`];
    if (toArr(p.missing).length) lines.push(`${toArr(p.missing).length} mod(s) of this mod pack are not installed.`);
    if (deps.length) lines.push("", "Requirement check:", ...inact.map(x => `○ ${modTitle(x.mod)} needs ${modTitle(x.name)} (installed, would be inactive)`), ...miss.map(x => `✕ ${modTitle(x.mod)} needs resource #${x.resourceId} (${x.slug || "not installed"})`));
    else lines.push("", "Requirement check: all good.");
    ask(`Activate “${lo ? lo.name : ""}”?`, lines.join("\n"), inact.length ? "Activate + required" : "Activate", () => libCall("uiApplyLoadoutChecked", d.id, inact.length > 0), false,
      inact.length ? "Activate without required" : null, () => libCall("uiApplyLoadoutChecked", d.id, false));
  }
  function nextUpdate() {
    const run = lib.upd.run; if (!run) return;
    if (run.i >= run.ids.length) { notify("info", `Updated ${run.ids.length} mod(s)`); lib.upd.run = null; return; }
    run.cur = run.ids[run.i]; run.i++; run.t = Date.now(); libCall("uiUpdateOne", run.cur);
  }
  function setFilterKeep(v) { lib.keep = Math.max(1, Math.min(5, +v || 1)); }

  function libClick(a, el) {
    const n = el.dataset.n, id = el.dataset.id;
    const r = n && byName(n);
    if (a === "lpage") { lib.page = el.dataset.k; lib.cmp = null; if (["duplicates", "conflicts", "broken"].includes(lib.page) && !lib.health) libCall("uiHealth");
      if (lib.page === "updates") libCall("uiUpdateQueue"); if (lib.page === "loadouts") mpCall("uiServerPacks"); if (lib.page !== "loadouts") lib.loEdit = null; page.scrollTop = 0; render(false); }
    else if (a === "lside") { lib.side = !lib.side; render(false); }
    else if (a === "lview") { lib.view = el.dataset.v; render(false); }
    else if (a === "lstack") { lib.stack = !lib.stack; render(false); }
    else if (a === "lfilters") { lib.filters = !lib.filters; render(false); }
    else if (a === "lcat") { const v = el.dataset.v; lib.cats.has(v) ? lib.cats.delete(v) : lib.cats.add(v); render(false); }
    else if (a === "ltagf") { const t = el.dataset.t; lib.tags.has(t) ? lib.tags.delete(t) : lib.tags.add(t); render(false); }
    else if (a === "lsupport") { lib.support = !lib.support; render(false); }
    else if (a === "lunf") { const k = el.dataset.k, v = el.dataset.v; if (k === "cat") lib.cats.delete(v); else if (k === "tag") lib.tags.delete(v); else if (k === "author") lib.author = ""; else if (k === "support") lib.support = false; else if (k === "q") lib.q = ""; render(false); }
    else if (a === "lclear") { lib.cats.clear(); lib.tags.clear(); lib.author = ""; lib.support = false; lib.q = ""; render(false); }
    else if (a === "lact") { if (r) { r.active = !r.active; libCall("uiSetActive", n, r.active); if (r.active) r.activeAt = Math.floor(Date.now() / 1000); render(false); } }
    else if (a === "lfav") { const f = lib.data.fav || (lib.data.fav = {}); f[n] ? delete f[n] : (f[n] = true); libCall("uiToggleFav", n); render(false); }
    else if (a === "lsel") { lib.sel.has(n) ? lib.sel.delete(n) : lib.sel.add(n); render(false); }
    else if (a === "lselall") { libRows().forEach(x => x._stack.forEach(y => lib.sel.add(y.name))); render(false); }
    else if (a === "lselclear") { lib.sel.clear(); render(false); }
    else if (a === "lbulk") { libCall("uiSetActiveMany", [...lib.sel], el.dataset.v === "on"); lib.sel.clear(); render(false); }
    else if (a === "lbulkrecycle") { const names = [...lib.sel]; ask("Delete (move to recycle folder)?", `${names.length} mod(s) will be deactivated and moved to /mods_recycle/. You can undo for 7 days from Duplicates › Recycle log.`, "Move to recycle", () => { libCall("uiRecycle", names); lib.sel.clear(); }, true); }
    else if (a === "ldrawer") { lib.drawer = n; lib.shot = 0; lib.edit = null; render(false); }
    else if (a === "ldrawerx") { lib.drawer = null; lib.edit = null; render(false); }
    else if (a === "lshot") { const imgs = r ? drawerImages(r) : drawerImages(byName(lib.drawer) || {}); if (imgs.length) lib.shot = (lib.shot + +el.dataset.d + imgs.length) % imgs.length; render(false); }
    else if (a === "ledit") { lib.edit = { name: n, title: r.ctitle || "", author: r.cauthor || "", notes: r.notes || "", cover: r.cover || "" }; render(false); }
    else if (a === "leditx") { lib.edit = null; render(false); }
    else if (a === "leditsave") { const e = lib.edit; if (!e) return true; const m = byName(e.name); if (m) { m.ctitle = e.title || null; m.cauthor = e.author || null; m.notes = e.notes || null; m.cover = e.cover || null; }
      libCall("uiSetMeta", e.name, { title: e.title, author: e.author, notes: e.notes, cover: e.cover }); lib.edit = null; render(false); }
    else if (a === "lrate") { const v = +el.dataset.v; if (r) r.urating = v || null; libCall("uiSetMeta", n, { rating: v }); render(false); }
    else if (a === "lsetcover") { if (r) r.cover = el.dataset.v; lib.shot = 0; libCall("uiSetMeta", n, { cover: el.dataset.v }); render(false); }
    else if (a === "lrepo") { libCall("uiOpenRepo", id); }
    else if (a === "lurl") { libCall("uiOpenUrl", el.dataset.v); }
    else if (a === "lnotdep") { const nd = lib.data.notDeps || (lib.data.notDeps = {}); const on = el.dataset.v === "1"; nd[n] = nd[n] || {}; if (on) nd[n][id] = true; else delete nd[n][id]; libCall("uiNotDep", n, +id, on); render(false); }
    else if (a === "lswitch") { const vers = mods().filter(x => x.stack === r.stack && x.name !== n && x.active).map(x => x.name); libCall("uiSetActiveMany", vers, false); libCall("uiSetActive", n, true); notify("info", "Switched to " + (r.file || n)); render(false); }
    else if (a === "lrecycle1") ask("Delete this version?", `${r ? r.file || n : n} will be moved to the recycle folder (undo for 7 days).`, "Move to recycle", () => libCall("uiRecycle", [n]), true);
    else if (a === "ltagadd") { lib.tagEdit = n; render(false); const i = page.querySelector(".ltin"); if (i) i.focus(); }
    else if (a === "ltagquick") { const t = el.dataset.t, cur = toArr((lib.data.tags || {})[n]); if (!cur.includes(t)) cur.push(t); (lib.data.tags || (lib.data.tags = {}))[n] = cur; libCall("uiSetTags", n, cur); render(false); }
    else if (a === "ltagrm") { const t = toArr((lib.data.tags || {})[n]).filter(x => x !== el.dataset.t); (lib.data.tags || (lib.data.tags = {}))[n] = t; libCall("uiSetTags", n, t); render(false); }
    else if (a === "lalways") { lib.loAlways = !lib.loAlways; render(false); }
    else if (a === "losave") { const t = String(lib.loName || "").trim(), d = String(lib.loDesc || "").trim();
      if (!t || !d) { lib.msg = { type: "error", msg: "Give the mod pack a title and a short description." }; render(false); return true; }
      libCall("uiSaveLoadout", { name: cutStr(t, 60), desc: cutStr(d, 300), fromActive: true, alwaysOn: lib.loAlways }); lib.loName = ""; lib.loDesc = ""; render(false); }
    else if (a === "loapply") libCall("uiCheckLoadout", id);
    else if (a === "loalways") { const lo = loById(id); if (lo) { lo.alwaysOn = !lo.alwaysOn; libCall("uiSaveLoadout", { id: lo.id, name: lo.name, alwaysOn: lo.alwaysOn }); render(false); } }
    else if (a === "loedit") { const lo = loById(id); if (lo) { lib.loEdit = { id, name: lo.name, desc: lo.desc || "", emoji: lo.emoji || "", alwaysOn: !!lo.alwaysOn, pinned: !!lo.pinned, cover: lo.cover || "", mods: toArr(lo.mods).slice() }; render(false); } }
    else if (a === "loview") { lib.page = "lo:" + id; render(false); }
    else if (a === "loetog") { lib.loEdit[el.dataset.k] = !lib.loEdit[el.dataset.k]; render(false); }
    else if (a === "loermmod") { const lo = loById(lib.loEdit.id); if (lo) lo.mods = toArr(lo.mods).filter(k => k !== el.dataset.k); lib.loEdit.mods = toArr(lo && lo.mods); render(false); }
    else if (a === "loex") { lib.loEdit = null; render(false); }
    else if (a === "loesave") { const e = lib.loEdit, lo = loById(e.id); let keys = toArr(lo ? lo.mods : e.mods);
      // pinned = exact files (n:<modname>), unpinned = follow repository id (id:<tagid>)
      keys = keys.map(k => { const m = mods().find(x => x.key === k || "n:" + x.name === k); if (!m) return k; return e.pinned ? "n:" + m.name : m.key; });
      if (!String(e.name || "").trim()) { lib.msg = { type: "error", msg: "A mod pack needs a title." }; render(false); return true; }
      libCall("uiSaveLoadout", { id: e.id, name: cutStr(e.name.trim(), 60), desc: cutStr(String(e.desc || "").trim(), 300), emoji: e.emoji, alwaysOn: e.alwaysOn, pinned: e.pinned, cover: e.cover, mods: keys }); lib.loEdit = null; render(false); }
    else if (a === "loexport") libCall("uiExportLoadout", id);
    else if (a === "pkexport") { const lo = loById(id); if (lo && !String(lo.desc || "").trim()) { lib.msg = { type: "error", msg: "Add a short description first (Edit), then share." }; render(false); return true; } libCall("uiExportPack", id); }
    else if (a === "pkopen") libCall("uiOpenShareFolder");
    else if (a === "pkexpx") { lib.packExport = null; render(false); }
    else if (a === "pklist") libCall("uiListPacks");
    else if (a === "pkbrowse") pickPackFile();
    else if (a === "pkjump") { lib.pkJump = true; libCall("uiListPacks"); }
    else if (a === "pkopenmods") libCall("uiOpenModsFolder");
    else if (a === "pkpick") libCall("uiPreviewPack", el.dataset.f);
    else if (a === "pkok") { const p = lib.pack; lib.pack = null; if (p) libCall("uiImportPackConfirm", p.path); render(false); }
    else if (a === "pkno") { lib.pack = null; render(false); }
    else if (a === "lodel") { const lo = loById(id); ask("Delete mod pack?", `“${lo ? lo.name : ""}” will be removed. Your mods are not touched.`, "Delete", () => libCall("uiDeleteLoadout", id), true); }
    else if (a === "loimport") {
      const t = String(lib.importText || "").replace(/^\uFEFF/, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, " ").trim();
      if (!t) lib.msg = { type: "error", msg: "Paste the contents of a .rfpack.json (or older .rfloadout.json) file into the box first." };
      else if (t.length > 512 * 1024) lib.msg = { type: "error", msg: "That text is too large to be a mod pack." };
      else { libCall("uiPreviewPackText", t, "pasted text"); lib.importText = ""; }
      render(false); }
    else if (a === "lofiles") libCall("uiListImports");
    else if (a === "loimportfile") libCall("uiImportLoadout", el.dataset.f);
    else if (a === "lsubmiss") { libCall("uiSubscribeMissing", [id]); st.subscribed.add(String(id)); dl.update([{ id, state: "queued", retry: true }]); lib.missing = toArr(lib.missing).filter(x => x.tagid !== id); render(false); }
    else if (a === "lsubmissall") { const ids = toArr(lib.missing).map(x => x.tagid).filter(Boolean); libCall("uiSubscribeMissing", ids); dl.update(ids.map(i => ({ id: i, state: "queued", retry: true }))); lib.missing = null; render(false); }
    else if (a === "lmissx") { lib.missing = null; render(false); }
    else if (a === "lscan") { libCall("uiHealth", true); lib.health = Object.assign({}, lib.health || {}, { scanning: true }); render(false); }
    else if (a === "dupcmp") { lib.cmp = +el.dataset.i; page.scrollTop = 0; render(false); }
    else if (a === "dupcmpx") { lib.cmp = null; render(false); }
    else if (a === "dupkeep") { const g = toArr(lib.health && lib.health.duplicates)[lib.cmp]; if (!g) return true; const others = toArr(g.mods).filter(x => x !== n);
      ask("Keep this copy?", `Keep: ${modTitle(n)}\nMove to recycle folder (undo for 7 days):\n${others.map(modTitle).join("\n")}`, "Keep & recycle others", () => { libCall("uiSetActive", n, true); libCall("uiRecycle", others); lib.cmp = null; }); }
    else if (a === "keepgo") { const vp = versionPlan(lib.keep); ask(`Keep ${lib.keep} version(s) per mod?`, `${vp.drop.length} older version(s) will be moved to the recycle folder:\n${vp.drop.map(x => byName(x) && byName(x).file || x).join("\n")}`, "Recycle", () => libCall("uiKeepVersions", lib.keep, "RECYCLE"), true); }
    else if (a === "rcrestore") libCall("uiRestore", +el.dataset.i);
    else if (a === "rcpurge") ask("Delete for good?", "Recycled files older than 7 days will be permanently deleted from /mods_recycle/. This cannot be undone.", "Delete permanently", () => libCall("uiPurgeRecycle", 7, "DELETE"), true);
    else if (a === "depall") libCall("uiActivateAllRequired");
    else if (a === "depact") libCall("uiActivateRequired", n);
    else if (a === "depfind") libCall("uiOpenUrl", "https://www.beamng.com/resources/" + encodeURIComponent(el.dataset.q) + "/");
    else if (a === "updcheck") { lib.upd.checking = true; lib.upd.checked = 0; libCall("uiCheckUpdates"); render(false); }
    else if (a === "updone") libCall("uiUpdateOne", id);
    else if (a === "updall") { lib.upd.run = { ids: updatable().map(e => e.id), i: 0 }; nextUpdate(); render(false); }
    else if (a === "updcancel") { notify("info", "Update all cancelled (the current download finishes)"); lib.upd.run = null; render(false); }
    else if (a === "updign") { const ig = lib.data.ignoreUpd || (lib.data.ignoreUpd = {}); const on = el.dataset.v === "1"; on ? ig[id] = true : delete ig[id]; libCall("uiIgnoreUpdate", id, on); render(false); }
    else if (a === "updlog") { if (lib.upd.log[id]) { delete lib.upd.log[id]; } else { lib.upd.log[id] = "…"; libCall("uiChangelog", id); } render(false); }
    else if (a === "updmissing") libCall("uiUpdateMissing");
    else if (a === "bkmake") libCall("uiBackup");
    else if (a === "bklist") libCall("uiListBackups");
    else if (a === "bkrestore") { const f = el.dataset.f; ask("Restore backup?", `Replaces Marketplace's tags, favorites, notes, ratings, names/covers, mod packs and settings with ${f}.`, "Restore", () => libCall("uiRestoreBackup", f), true); }
    else if (a === "bkrestoretext") { const t = lib.restoreText; if (!t.trim()) { lib.msg = { type: "error", msg: "Paste a backup's text into the box first." }; render(false); } else ask("Restore pasted backup?", "Replaces Marketplace's metadata (mod files are not touched).", "Restore", () => { libCall("uiRestoreBackup", t); lib.restoreText = ""; }, true); }
    else if (a === "lsettog") { const s = lib.data.settings || (lib.data.settings = {}); s[el.dataset.k] = el.dataset.k === "autoCheck" ? s.autoCheck === false : !s[el.dataset.k]; libCall("uiSettings", { [el.dataset.k]: s[el.dataset.k] }); render(false); }
    else if (a === "lpar") { const v = +el.dataset.v; if ([1, 2, 3, 10].includes(v)) { lib.data.parallel = v; libCall("uiSettings", { parallel: v }); render(false); } }
    else if (a === "spon" || a === "spoff") { const p = toArr(lib.spacks && lib.spacks.packs).find(x => x.id === id); if (!p) return true;
      if (a === "spoff") { mpCall("uiServerPackUse", id, false); return true; }
      if (lib.spacks.inSession || lib.spacks.joining || joinActive()) { notify("error", "Leave the BeamMP server first: on a server BeamMP turns off every mod that isn't that server's, so this pack is for single-player."); return true; }
      ask("Use the mods of " + (p.name || p.key) + " in single-player?", `Moves ${p.count} mods (${fmtBytes(p.bytes || 0)}) into mods › marketplace_servers and turns them on, like any other mod. Turn them off here (or in the Mod Manager) whenever you like; BeamMP turns them off by itself when you join any server.\n\nIf you also have some of these mods installed separately, keep only one copy turned on.`,
        "Use in single-player", () => mpCall("uiServerPackUse", id, true), false); }
    else if (a === "spopen") mpCall("uiServerPackOpen", id);
    else if (a === "spdel") { const p = toArr(lib.spacks && lib.spacks.packs).find(x => x.id === id); if (!p) return true;
      ask("Delete the saved mods of " + (p.name || p.key) + "?", `Deletes ${p.count} mod files (${fmtBytes(p.bytes || 0)}) from your disk${p.installed ? ", including the ones in mods › marketplace_servers" : ""}. BeamMP's own cache isn't touched, so rejoining the server still works.`,
        "Delete", () => mpCall("uiServerPackDelete", id, "DELETE"), true); }
    else if (a === "ltheme") { const s = lib.data.settings || (lib.data.settings = {}); s.theme = el.dataset.v; setAccent(""); libCall("uiSettings", { theme: s.theme }); render(false); }
    else if (a === "laccent") { const s = lib.data.settings || (lib.data.settings = {}); s.accent = el.dataset.v; applyAccent(); libCall("uiSettings", { accent: s.accent }); render(false); }
    else if (a === "bell") { lib.bell = !lib.bell; lib.unread = 0; renderTools(); }
    else if (a === "bellclear") { lib.notes = []; try { const s = store(); if (s) s.setItem("marketplaceMod.notes", "[]"); } catch (e) { } renderTools(); } /* ignore */
    else if (a === "lmsgx") { lib.msg = null; render(false); }
    else if (a === "tournext") { if (lib.tour >= TOUR.length - 1) tourDone(); else lib.tour++; render(false); }
    else if (a === "tourprev") { lib.tour = Math.max(0, lib.tour - 1); render(false); }
    else if (a === "tourskip") { tourDone(); render(false); }
    else if (a === "tourstart") { lib.tour = 0; render(false); }
    else return false;
    return true;
  }
  function mpClick(a, el) {
    if (a === "mpset") { mp[el.dataset.k] = el.dataset.v; mp.limit = 150; render(false); }
    else if (a === "mpfree") { mp.free = !mp.free; render(false); }
    else if (a === "mpsort") { const k = el.dataset.k; mp.dir = mp.sort === k ? -mp.dir : (k === "name" || k === "map" || k === "loc" ? 1 : -1); mp.sort = k; render(false); }
    else if (a === "mpmore") { mp.limit += 150; render(false); }
    else if (a === "mpfav") { const f = mp.data.fav || (mp.data.fav = {}); const k = el.dataset.k; f[k] ? delete f[k] : (f[k] = true); if (mp.src === "lua") mpCall("uiFav", k); render(false); }
    else if (a === "mpdetail") { const k = el.dataset.k; mpCall("uiRecent", k); const r = toArr(mp.data.recent).filter(x => x !== k); r.unshift(k); mp.data.recent = r.slice(0, 15);
      if (mp.src === "js") mp.detail = serverDetailJS(k); else { const s = toArr(mp.data.servers).find(x => x.key === k); mp.detail = s ? Object.assign({ playerList: [], modList: [], ip: k.split(":")[0], port: k.split(":")[1] }, s) : null; mpCall("uiServer", k); }
      render(false); }
    else if (a === "mpretry") retryServers();
    else if (a === "mpclose") { mp.detail = null; render(false); }
    else if (a === "mpjoin") startJoin(el.dataset.k);
    else if (a === "mpjyes") { const j = mp.join; if (j) { j.prompt = false; j.status = "Downloading the server's mods…"; } mpCall("uiJoinApprove"); render(false); }
    else if (a === "mpjno") { mp.join = null; mpCall("uiJoinReject"); notify("info", "Join cancelled: server mods were not downloaded."); render(false); }
    else if (a === "mpjcancel") { const j = mp.join; mp.join = null; win.clearTimeout(mp.joinT); win.clearTimeout(mp.doneT); if (j && (j.phase === "connecting" || j.phase === "sent")) mpCall("uiJoinCancel"); else if (j) mpCall("uiJoinDone", "join window closed (" + j.phase + ")"); render(false); }
    else if (a === "mpjguest") guestJoin();
    else if (a === "mpjmin" || a === "mpjmax") { const j = mp.join; if (j) { j.min = a === "mpjmin"; try { const s0 = store(); if (s0) s0.setItem("marketplaceMod.joinMin", j.min ? "1" : "0"); } catch (e) { } } render(false); } /* ignore */
    else if (a === "mpjkeep") { const j = mp.join; if (j) { setKeep(j.key, !j.keep); j.keep = !j.keep; if (j.keep && j.done && !j.saving) { j.saving = true; mpCall("uiServerSave", j.key, j.sname || j.name || ""); } } render(false); }
    else if (a === "mpkeep") { const k = el.dataset.k; setKeep(k, !keepOn(k)); render(false); }
    else if (a === "mpjcopy") { const j = mp.join; if (j) mpCall("uiCopy", j.addr || j.key); }
    else if (a === "mpcopy") mpCall("uiCopy", el.dataset.v);
    else if (a === "mpsite") libCall("uiOpenUrl", "https://beammp.com");
    else return false;
    return true;
  }

  function render(animate) {
    if (st.hello) root.querySelector("#rfm-ver").textContent = "Game " + st.hello.gameMajor;
    root.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.t === st.view));
    const y = page.scrollTop; saveRails();
    vreg.clear();
    let html;
    try {
      html = st.view === "home" ? homeHTML() : st.view === "results" ? browseHTML() : st.view === "library" ? libraryHTML()
        : st.view === "servers" ? serversHTML() : detailHTML();
      html += welcomeHTML() + confirmHTML() + joinHTML() + (st.view === "library" ? packPreviewHTML() : "");
    } catch (e) {
      console.error("Marketplace render error", e);
      html = `<div class="empty"><b>Something went wrong showing this page</b>${esc(e && e.message || e)}<br><br>
        <button class="btn sec" data-a="home">Back to Discover</button> <button class="btn sec" data-a="classic">Classic repository</button></div>`;
    }
    const full = `<div class="${animate ? "wrap fade" : "wrap"}" data-view="${st.view}">${html}</div>`;
    const cur = page.firstElementChild;
    if (!animate && cur && cur.getAttribute("data-view") === st.view) {
      if (full === lastHTML) { renderTools(); renderPill(); return; } // nothing changed: don't touch the DOM
      const tpl = doc.createElement("div"); tpl.innerHTML = iconize(full);
      morph(cur, tpl.firstElementChild);
    } else {
      page.innerHTML = iconize(full);
      if (animate) page.scrollTop = 0;
    }
    lastHTML = full;
    renderTools(); renderPill();
    sizeRails(); restoreRails(); if (!animate) page.scrollTop = y; padsSoon();
    vwindow(true);
    markLoaded();
    updateCatalog();
    st.renders = (st.renders || 0) + 1;
    if (st.view === "home") watchHero(); else heroVisible = false;
  }
  // performance mode: fewer effects
  function autoHid() { try { const s0 = store(); return !!s0 && s0.getItem("marketplaceMod.hideAutomation") === "1"; } catch (e) { return false; } }
  function perfOn() { try { const s0 = store(); return !!(s0 && s0.getItem("marketplaceMod.perf") === "1"); } catch (e) { return false; } }
  function applyPerf() { root.classList.toggle("perf", perfOn()); }
  const fmtMB = b => b ? (b / 1048576).toFixed(b < 10485760 ? 1 : 0) : "0";
  const fmtEta = s => s == null ? "" : s < 60 ? Math.ceil(s) + "s left" : s < 3600 ? Math.round(s / 60) + " min left" : (s / 3600).toFixed(1) + " h left";
  const fmtSpeed = b => !b ? "" : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB/s" : Math.round(b / 1024) + " KB/s";
  function modInfo(v) { return (v.id != null && st.titles.get(String(v.id))) || {}; }
  function dlItem(v) {
    const mi = modInfo(v), title = mi.title || v.title || v.file || ("Mod " + v.id), pct = Math.round((v.progress || 0) * 100);
    const line = v.state === "downloading" ? [pct + "%", v.total ? `${fmtMB(v.now)} / ${fmtMB(v.total)} MB` : "", fmtSpeed(v.speed), fmtEta(v.eta)]
      : v.state === "queued" ? ["Queued"] : v.state === "done" ? ["✓ Installed", v.total ? fmtMB(v.total) + " MB" : ""]
      : ["✕ " + (v.error || "Failed")];
    return `<div class="dli ${v.state}" data-key="d-${esc(v.id != null ? v.id : v.file)}">${mi.icon || mi.cover ? `<img class="tn" src="${esc(mi.cover || mi.icon)}" alt="">` : `<div class="tn"></div>`}
      <div class="tx"><div class="tt" title="${esc(title)}">${esc(title)}</div><div class="ds">${line.filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}</div>
      ${v.state === "downloading" || v.state === "queued" || v.state === "done" ? `<div class="pbar"><i style="width:${v.state === "done" ? 100 : pct}%"></i></div>` : ""}</div>
      ${v.state === "failed" && v.id != null ? `<button class="btn sec" data-a="retry" data-id="${esc(v.id)}">Retry</button>` : ""}</div>`;
  }
  function toolsHTML() {
    const act = dl.active(), all = dl.list(), ov = dl.overall(), C = 2 * Math.PI * 17;
    const inst = st.inst ? `<span class="inst" data-a="modsmgr" title="Open Mods Manager">Installed: <b>${Number(st.inst.total).toLocaleString("en-US")}</b> mods (${Number(st.inst.active).toLocaleString("en-US")} active)</span>` : "";
    const ring = ov == null ? "" : `<svg class="ring" width="38" height="38"><circle cx="19" cy="19" r="17" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2.5"></circle><circle cx="19" cy="19" r="17" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - ov)).toFixed(1)}"></circle></svg>`;
    const nFail = all.filter(v => v.state === "failed" && v.id != null).length;
    const panel = !st.dlOpen ? "" : `<div class="dlp" data-key="dlp"><h6><span>Downloads</span>${nFail > 1 ? `<span style="cursor:pointer" data-a="retryall">↻ Retry ${nFail} failed</span>` : ""}${all.some(v => v.state === "done") ? `<span style="cursor:pointer" data-a="dlclear">Clear finished</span>` : ""}</h6>
      ${all.length ? all.map(dlItem).join("") : `<div class="ds" style="padding:14px 8px;color:var(--tx3);font-size:12px">No downloads. Subscribing to a mod downloads it through the game.</div>`}</div>`;
    const bell = `<div class="dlb bell" data-a="bell" title="Notifications"><span>🔔</span>${lib.unread ? `<span class="bdg">${Math.min(lib.unread, 50)}</span>` : ""}</div>${lib.bell ? `<div class="dlp bellp" data-key="bellp"><h6><span>Notifications</span>${lib.notes.length ? `<span style="cursor:pointer" data-a="bellclear">Clear</span>` : ""}</h6>
      ${lib.notes.map((x, i) => `<div class="nti ${esc(x.type)}" data-key="nt-${i}-${x.t}"><span>${esc(x.msg)}</span><em>${esc(rel(x.t))}</em></div>`).join("") || `<div class="ds" style="padding:14px 8px;color:var(--tx3);font-size:12px">No notifications yet.</div>`}</div>` : ""}`;
    return `${inst}${bell}<div class="dlb" data-a="dlpanel" title="Downloads">${ring}<span>⬇</span>${act.length ? `<span class="bdg">${act.length}</span>` : ""}</div>${panel}`;
  }
  let lastTools = "";
  function renderTools() {
    const el = root.querySelector("#rfm-tools"); if (!el) return;
    const html = toolsHTML(); if (html === lastTools) return; lastTools = html;
    const d = doc.createElement("div"); d.className = "tools"; d.id = "rfm-tools"; d.innerHTML = iconize(html);
    morph(el, d);
  }
  function rememberTitles(list) { for (const m of toArr(list)) if (m && m.id != null) { if (m.requires) st.reqs.set(String(m.id), m.requires); st.titles.set(String(m.id), { title: m.title, icon: m.icon, cover: m.cover }); if (m.file) dl.learnFile(m.id, m.file); } }
  let lastHTML = "";
  function catPanelHTML() {
    const c = st.catalog || {}, f = n => Number(n || 0).toLocaleString("en-US"), rows = toArr(c.perCat);
    if (!rows.length) return `<h4>Catalog by category</h4><div class="nt">Waiting for the first catalog status…</div>`;
    return `<h4>Catalog by category ${c.done ? "· complete" : c.paused ? "· paused while you browse" : "· filling in"}</h4>` + rows.map(r => {
      const pct = r.total ? Math.min(100, Math.round(r.have * 100 / r.total)) : (r.have ? 100 : 0), ok = r.total && r.have >= r.total;
      return `<div class="cr ${ok ? "ok" : ""} ${r.current ? "cur" : ""}"><b>${esc(r.name)}${r.current ? " ⟳" : ""}</b><div class="bar"><i style="width:${pct}%"></i></div><span class="num">${f(r.have)} / ${r.total ? f(r.total) : "?"}</span></div>`;
    }).join("") + `<div class="nt">Totals are what the in-game repository server reports. Marketplace refreshes this on its own in the background, gently, and pauses while you browse.</div>`;
  }
  function updateCatalog() { const el = root.querySelector("#rfm-cat"); if (el) { const t = catText(); if (el.textContent !== t) el.textContent = t; }
    const p = root.querySelector("#rfm-catpanel"); if (p && !p.hidden) { const h = iconize(catPanelHTML()); if (p.innerHTML !== h) p.innerHTML = h; } }
  function markLoaded() { root.querySelectorAll("img.im:not(.ld)").forEach(i => { if (i.complete && i.naturalWidth) i.classList.add("ld"); }); }
  function go(view) {
    st.view = view;
    if (view === "library") { try { const s0 = store(); if (lib.tour == null && !(s0 && s0.getItem("marketplaceMod.tourDone")) && !lib.tourShown) { lib.tourShown = true; lib.tour = 0; } } catch (e) { } libCall("uiLibrary"); if (!lib.healthAsked) { lib.healthAsked = true; libCall("uiHealth"); } lib.autoChecked = false; } /* ignore */
    if (view === "servers") startServerRefresh(); else stopServerRefresh();
    render(true);
  }

  const PAGE = 60;
  function luaFilters() {
    const f = st.f, mb = v => v === "" || v == null || isNaN(+v) ? undefined : Math.round(+v * 1048576);
    return { updatedWithin: f.updatedWithin || undefined, minSize: mb(f.minSizeMB), maxSize: mb(f.maxSizeMB),
      minDownloads: f.minDownloads || undefined, minRating: f.minRating || undefined, author: f.author || undefined,
      hideSubscribed: f.hideSubscribed || undefined, statuses: f.statuses.length ? f.statuses : undefined,
      vehicleTypes: f.vehicleTypes.length ? f.vehicleTypes : undefined, hasPhotos: f.hasPhotos || undefined };
  }
  function query(kind) {
    call("uiQuery", toLua({ reqId: st.reqId, kind, limit: st.limit, query: st.q, categories: [...st.cats], hideOutdated: st.hideOutdated,
      onlyCurrent: st.onlyCurrent, hideUnstable: st.hideUnstable, sort: st.sort, ...luaFilters() }));
  }
  function search() {
    saveFilters();
    st.q = qIn.value.trim(); st.reqId++; st.limit = PAGE; st.loadingMore = false;
    st.results = null;
    query("new");
    if (st.view !== "results") go("results"); else { page.scrollTop = 0; render(false); }
  }
  // integer-pixel card columns in rails (fractional widths made cards drift by a pixel while scrolling)
  function sizeRails() {
    root.querySelectorAll(".rail").forEach(r => {
      const w = r.clientWidth - 4; if (w <= 0) return;
      const cw = Math.max(120, Math.floor((w - 4 * 16) / 5)) + "px";
      if (r.style.getPropertyValue("--cw") !== cw) r.style.setProperty("--cw", cw);
    });
    // whole-pixel columns for the result grids too
    root.querySelectorAll(".grid.rv, .gal2.rv").forEach(g => {
      const min = g.classList.contains("gal2") ? 380 : 250, gap = g.classList.contains("gal2") ? 14 : 18, w = g.clientWidth; if (w <= 0) return;
      const cols = Math.max(1, Math.floor((w + gap) / (min + gap))), cw = Math.floor((w - (cols - 1) * gap) / cols);
      const v = `repeat(${cols},${cw}px)`; if (g.style.gridTemplateColumns !== v) g.style.gridTemplateColumns = v;
    });
  }
  function vswap(el, html) {
    const t = doc.createElement("div"); t.innerHTML = iconize(html);
    const n = t.firstElementChild; if (n) el.replaceWith(n); return n;
  }
  let vraf = 0, vlast = 0, vtimer = 0;
  function vwindow(now) {
    if (now) { if (vraf) { try { win.cancelAnimationFrame(vraf); } catch (e) { } vraf = 0; } return vrun(); } /* ignore */
    if (vraf) return;
    const raf = win.requestAnimationFrame ? win.requestAnimationFrame.bind(win) : f => win.setTimeout(f, 16);
    vraf = raf(() => { vraf = 0; if (performance.now() - vlast < 50) { clearTimeout(vtimer); vtimer = win.setTimeout(() => vwindow(), 60); return; } vrun(); });
  }
  let vlastTop = 0;
  function vrange(cont, horizontal, pr, H) {
    const kids = cont.children, n = kids.length; if (!n) return null;
    const cr = cont.getBoundingClientRect(), f = kids[0];
    if (horizontal) {
      const pitch = n > 1 ? (kids[1].offsetLeft - f.offsetLeft) : f.offsetWidth; if (pitch <= 0) return null;
      const vis = cr.bottom > pr.top - H * 0.6 && cr.top < pr.bottom + H * 0.9;
      const keep = !(cr.bottom < pr.top - H * 2 || cr.top > pr.bottom + H * 2.5);
      const x0 = cont.scrollLeft, w = cont.clientWidth;
      return { n, lo: vis ? Math.floor((x0 - w * 0.4) / pitch) : 1, hi: vis ? Math.ceil((x0 + w * 1.6) / pitch) : 0,
        klo: keep ? Math.floor((x0 - w * 1.5) / pitch) : 1, khi: keep ? Math.ceil((x0 + w * 2.5) / pitch) : 0 };
    }
    let cols = 1; const t0 = f.offsetTop; while (cols < n && kids[cols].offsetTop === t0) cols++;
    const pitch = n > cols ? kids[cols].offsetTop - t0 : f.offsetHeight + 12; if (pitch <= 0) return null;
    const top = cr.top + t0; // viewport y of the first row
    const row = y => Math.floor((y - top) / pitch);
    return { n, lo: row(pr.top - H * 0.6) * cols, hi: (row(pr.bottom + H * 0.9) + 1) * cols - 1,
      klo: row(pr.top - H * 2) * cols, khi: (row(pr.bottom + H * 2.5) + 1) * cols - 1 };
  }
  function vrun() {
    vlast = performance.now();
    const conts = root.querySelectorAll(".rail, .grid.rv, .cl.rv, .dl2.rv, .gal2.rv"); if (!conts.length) return;
    const pr = page.getBoundingClientRect(), H = pr.height || 900;
    const st0 = page.scrollTop, fling = Math.abs(st0 - vlastTop) > H * 1.5; vlastTop = st0;
    if (fling) { clearTimeout(vtimer); vtimer = win.setTimeout(() => vwindow(), 90); }
    const todo = [], born = [];
    for (const c of conts) {
      const rg = vrange(c, c.classList.contains("rail"), pr, H); if (!rg) continue;
      const kids = c.children;
      for (let i = 0; i < rg.n; i++) {
        const el = kids[i], k = el.dataset.vk; if (!k) continue;
        const on = vlive.has(k);
        if (on && (i < rg.klo || i > rg.khi)) todo.push([el, k, false]);
        else if (!on && !fling && i >= rg.lo && i <= rg.hi && vreg.has(k)) todo.push([el, k, true]);
      }
    }
    for (const [el, k, on] of todo) { // writes after all reads (one layout)
      if (on) { vlive.add(k); const n = vswap(el, vreg.get(k)().replace(/^(\s*<div )/, `$1data-vk="${k}" `)); if (n) born.push(n); }
      else { vlive.delete(k); vswap(el, vghost(k[0], k, el.getAttribute("data-key") || "")); }
    }
    for (const n of born) { const kind = n.dataset.vk[0]; if (!vh[kind] && kind !== "g") { const b = kind === "c" ? n.querySelector(".cbody") : n; const h = b ? Math.round(b.offsetHeight) : 0; if (h > 0) vh[kind] = h; } }
    if (todo.length) { markLoaded(); lastHTML = ""; }
  }
  page.addEventListener("scroll", () => vwindow(), { passive: true });
  root.addEventListener("scroll", e => { const t = e.target; if (t && t.classList && t.classList.contains("rail")) vwindow(); }, true);
  try { win.addEventListener("resize", () => { sizeRails(); vwindow(); }); } catch (e) { } /* no window */

  // infinite scroll: first page through the local catalog, then ask the server for more
  function loadMore() {
    const r = st.results; if (!r || st.loadingMore) return;
    const shown = toArr(r.items).length;
    if (shown < r.total) { st.loadingMore = true; st.limit = shown + PAGE; query("local"); }
    else if (r.serverMore && st.q) { st.loadingMore = true; query("server"); render(false); }
  }
  root.addEventListener("scroll", e => { const t = e.target; if (t && t.dataset && t.dataset.rail) updatePads(t); }, true);
  try { win.addEventListener("resize", padsSoon); } catch (e) { } /* no window */
  root.addEventListener("load", e => { if (e.target && e.target.tagName === "IMG") padsSoon(); }, true);
  page.addEventListener("scroll", () => {
    if (st.view === "results" && page.scrollTop + page.clientHeight > page.scrollHeight - 900) loadMore();
  }, { passive: true });

  root.addEventListener("click", ev => {
    const el = ev.target.closest("[data-a]"); if (!el || !el.dataset.a) return;
    const a = el.dataset.a, id = el.dataset.id;
    ev.stopPropagation();
    if (a === "cfyes") { const c = st.confirm; st.confirm = null; if (c && c.run) c.run(); render(false); return; }
    if (a === "cfno") { const c = st.confirm; st.confirm = null; if (c && c.cancel) c.cancel(); render(false); return; }
    if (a === "cfalt") { const c = st.confirm; st.confirm = null; if (c && c.runAlt) c.runAlt(); render(false); return; }
    if (a === "library" || a === "servers") { go(a); return; }
    // no repository downloads while BeamMP downloads a server's mods (the Lua side refuses them too)
    if (DL_ACTIONS.has(a) && joinActive()) { const msg = "BeamMP is downloading this server's mods right now. Repository downloads wait until the join has finished or was cancelled: they would share your connection, and BeamMP turns off every mod that isn't the server's when it loads the map.";
      notify("error", msg); st.confirm = { title: "Downloads wait for BeamMP", text: msg, ok: "OK", run: () => {} }; render(false); return; }
    if (libClick(a, el) || mpClick(a, el)) return;
    if (a === "sub" && reqCountOf(id) > 0 && !st.planFor) { st.planFor = id; call("uiInstallPlan", JSON.stringify(id));
      win.setTimeout(() => { if (st.planFor === id) { st.planFor = null; st.confirm = { title: "Couldn't check requirements", text: "Install just this mod?", ok: "Just this mod", run: () => subscribeNow([id]) }; render(false); } }, 4000); return; }
    if (a === "reqweb") { libCall("uiOpenUrl", "https://www.beamng.com/resources/" + encodeURIComponent(el.dataset.v) + "/"); return; }
    if (a === "sub") { st.subscribed.add(id); dl.update([{ id, state: "queued", retry: true }]); call("uiSubscribe", JSON.stringify(id)); render(false); }
    else if (a === "close") close();
    else if (a === "home") { qIn.value = ""; go("home"); }
    else if (a === "browse") search();
    else if (a === "more") loadMore();
    else if (a === "detail") { st.prev = st.view; st.detail = null; st.shot = 0; call("uiDetail", JSON.stringify(id)); go("detail"); }
    else if (a === "back") go(st.prev || "home");
    else if (a === "official") { call("uiOpenOfficial", JSON.stringify(id)); close(true); }
    else if (a === "autotog") { const hide = !autoHid(); try { const s0 = store(); if (s0) s0.setItem("marketplaceMod.hideAutomation", hide ? "1" : "0"); } catch (e) { } call("uiSetAutomationHidden", hide ? "true" : "false"); render(false); } /* ignore */
    else if (a === "perftog") { try { const s0 = store(); if (s0) s0.setItem("marketplaceMod.perf", perfOn() ? "0" : "1"); } catch (e) { } applyPerf(); render(false); } /* ignore */
    else if (a === "opensettings") { if (st.welcome) markAccentSeen(); st.welcome = false; lib.page = "settings"; lib.tourShown = true; go("library"); }
    else if (a === "accpick") { setAccent(el.dataset.v === "orange" ? "orange" : el.dataset.v); render(false); }
    else if (a === "welok") { markAccentSeen(); st.welcome = false; render(false); }
    else if (a === "welskip") { markAccentSeen(); setAccent(""); st.welcome = false; render(false); }
    else if (a === "catpanel") { const p = root.querySelector("#rfm-catpanel"); if (p) { p.hidden = !p.hidden; if (!p.hidden) p.innerHTML = iconize(catPanelHTML()); } }
    else if (a === "classic") { close(true); if (opts.openClassic) opts.openClassic(); }
    else if (a === "period") { st.period = el.dataset.p; st.top = null; call("uiTop", JSON.stringify(st.period)); render(false); }
    else if (a === "hero") { st.heroIdx = +el.dataset.i; renderHeroOnly(); startHero(); }
    else if (a === "scroll") { const r = root.querySelector(`[data-rail="${el.dataset.k}"]`); if (r) r.scrollBy({ left: +el.dataset.d * r.clientWidth * 0.9, behavior: "smooth" }); }
    else if (a === "seeall") { st.cats = new Set([+el.dataset.cat]); qIn.value = ""; st.sort = "popular"; search(false); }
    else if (a === "sort") { st.sort = el.dataset.s; search(false); }
    else if (a === "tog") { st[el.dataset.k] = !st[el.dataset.k]; search(false); }
    else if (a === "cat") { const c = +el.dataset.c; st.cats.has(c) ? st.cats.delete(c) : st.cats.add(c); search(false); }
    else if (a === "dlpanel") { st.dlOpen = !st.dlOpen; renderTools(); }
    else if (a === "dlclear") { dl.clear(); renderTools(); }
    else if (a === "retry") { dl.update([{ id, state: "queued", retry: true }]); call("uiRetry", JSON.stringify(id)); render(false); }
    else if (a === "retryall" || a === "retrypack") {
      const ids = dl.list().filter(v => v.state === "failed" && v.id != null && (a === "retryall" || v.pack === id)).map(v => String(v.id));
      for (const i of ids) { dl.update([{ id: i, state: "queued", retry: true }]); call("uiRetry", JSON.stringify(i)); }
      if (ids.length) notify("info", "Retrying " + ids.length + " download(s)"); render(false); }
    else if (a === "modsmgr") { lib.page = "all"; go("library"); }
    else if (a === "bview") { setView(el.dataset.k); }
    else if (a === "fsec") { const k = el.dataset.k; st.fclosed.has(k) ? st.fclosed.delete(k) : st.fclosed.add(k); saveView(); el.parentElement.classList.toggle("closed"); }
    else if (a === "clearcats") { st.cats.clear(); search(false); }
    else if (a === "fset") { const k = el.dataset.k, v = el.dataset.v; st.f[k] = typeof defaultFilters()[k] === "number" ? +v : v; search(); }
    else if (a === "fmulti") { const k = el.dataset.k, v = el.dataset.v; st.f[k] = st.f[k].includes(v) ? st.f[k].filter(x => x !== v) : st.f[k].concat(v); search(); }
    else if (a === "ftog") { st.f[el.dataset.k] = !st.f[el.dataset.k]; search(); }
    else if (a === "unf") { clearFilter(el.dataset.k); search(); }
    else if (a === "clearall") { st.f = defaultFilters(); st.cats.clear(); st.onlyCurrent = false; st.hideUnstable = false; search(); }
    else if (a === "author") { st.f.author = el.dataset.n; st.authors = null; const i = root.querySelector('[data-f="author"]'); if (i) i.value = st.f.author; search(); }
    else if (a === "shot") { st.shot = +el.dataset.i; render(false); }
  });
  let typeTimer = null, fTimer = null;
  function setView(v) { if (!VIEWS.some(x => x[0] === v) || st.bview === v) return; st.bview = v; saveView(); if (st.view === "results") render(false); }
  // range sliders: live label while dragging, apply on release (no re-render mid-drag)
  function sliderLabel(el) {
    const i = +el.value, k = el.dataset.rs, n = +el.max + 1; el.style.setProperty("--p", (i / (n - 1) * 100).toFixed(1) + "%");
    const lab = root.querySelector(`[data-rl="${k}"]`); if (!lab) return;
    lab.textContent = k === "dl" ? MINDL[i][1] : k === "hi" && i === SIZE_STEPS.length - 1 ? "No limit" : SIZE_STEPS[i] + " MB";
  }
  function sliderCommit(el) {
    const i = +el.value, k = el.dataset.rs;
    if (k === "dl") st.f.minDownloads = MINDL[i][0];
    if (k === "lo") st.f.minSizeMB = i ? String(SIZE_STEPS[i]) : "";
    if (k === "hi") st.f.maxSizeMB = i === SIZE_STEPS.length - 1 ? "" : String(SIZE_STEPS[i]);
    if (st.f.minSizeMB !== "" && st.f.maxSizeMB !== "" && +st.f.minSizeMB > +st.f.maxSizeMB) { if (k === "lo") st.f.maxSizeMB = st.f.minSizeMB; else st.f.minSizeMB = st.f.maxSizeMB; }
    search();
  }
  page.addEventListener("change", ev => { const t = ev.target; if (t && t.dataset && t.dataset.rs) sliderCommit(t); });
  page.addEventListener("keydown", ev => {
    if (ev.target.matches && ev.target.matches("input,textarea")) ev.stopPropagation();
    const ds = ev.target.dataset || {};
    if (ds.lf === "tag") {
      if (ev.key === "Enter") { const t = ev.target.value.trim(); const n = ds.n; if (t) { const cur = toArr((lib.data.tags || {})[n]); if (!cur.includes(t)) cur.push(t); (lib.data.tags || (lib.data.tags = {}))[n] = cur; libCall("uiSetTags", n, cur); } lib.tagEdit = null; render(false); }
      if (ev.key === "Escape") { lib.tagEdit = null; render(false); }
    }
  });
  page.addEventListener("change", ev => { const t = ev.target; if (t && t.tagName === "SELECT") t.dispatchEvent(new win.Event("input", { bubbles: true })); });
  // load-out drag & drop reorder
  page.addEventListener("dragstart", ev => { const c = ev.target.closest && ev.target.closest("[data-lo]"); if (!c) return; lib.dragId = c.dataset.lo; try { ev.dataTransfer.setData("text/plain", lib.dragId); ev.dataTransfer.effectAllowed = "move"; } catch (e) { } }); /* ignore */
  page.addEventListener("dragover", ev => { if (lib.dragId && ev.target.closest && ev.target.closest("[data-lo]")) ev.preventDefault(); });
  page.addEventListener("drop", ev => {
    const c = ev.target.closest && ev.target.closest("[data-lo]"); if (!c || !lib.dragId) return; ev.preventDefault();
    const los = toArr(lib.data.loadouts), from = los.findIndex(x => x.id === lib.dragId), to = los.findIndex(x => x.id === c.dataset.lo);
    if (from >= 0 && to >= 0 && from !== to) { const [m] = los.splice(from, 1); los.splice(to, 0, m); lib.data.loadouts = los; libCall("uiReorderLoadouts", los.map(x => x.id)); }
    lib.dragId = null; render(false);
  });
  page.addEventListener("dragend", () => { if (lib.dragId) { lib.dragId = null; render(false); } });
  page.addEventListener("keyup", ev => { if (ev.target.matches && ev.target.matches("input")) ev.stopPropagation(); });
  let lTimer = null;
  page.addEventListener("input", ev => { const t0 = ev.target; if (t0 && t0.dataset && t0.dataset.acc === "custom") { setAccent(t0.value.toLowerCase()); const sw = t0.closest(".acsw"); if (sw) { sw.style.setProperty("--sw", t0.value); root.querySelectorAll(".acsw.on").forEach(x => x.classList.remove("on")); sw.classList.add("on"); } } });
  page.addEventListener("change", ev => { const t0 = ev.target; if (t0 && t0.dataset && t0.dataset.acc === "custom") render(false); });
  page.addEventListener("input", ev => {
    const ds = ev.target.dataset || {};
    if (ds.rs) { sliderLabel(ev.target); return; }
    if (ds.lf === "sort" || ds.lf === "author") { lib[ds.lf] = ev.target.value; win.clearTimeout(lTimer); lTimer = win.setTimeout(() => render(false), ds.lf === "author" ? 300 : 0); return; }
    if (ds.lf === "keep") { setFilterKeep(ev.target.value); render(false); return; }
    if (ds.lf === "bulkLo") { const v = ev.target.value; if (!v) return; const keys = mods().filter(r => lib.sel.has(r.name)).map(r => r.key);
      if (v === "__new") { libCall("uiSaveLoadout", { name: `Selection (${keys.length})`, mods: keys }); lib.page = "loadouts"; }
      else { libCall("uiLoadoutMods", v, keys); const lo = loById(v); notify("info", `Added ${keys.length} mod(s) to ${lo ? lo.name : "mod pack"}`); }
      lib.sel.clear(); render(false); return; }
    if (ds.le && lib.edit) { lib.edit[ds.le] = ev.target.value; return; }
    if (ds.loe && lib.loEdit) { lib.loEdit[ds.loe] = ev.target.value; return; }
    if (ds.ls) { const s = lib.data.settings || (lib.data.settings = {}); s[ds.ls] = +ev.target.value; if (ds.ls === "keepVersions") lib.keep = +ev.target.value; libCall("uiSettings", { [ds.ls]: +ev.target.value }); render(false); return; }
    if (ds.lf && ds.lf !== "tag") { lib[ds.lf] = ev.target.value; if (ds.lf === "q") { win.clearTimeout(lTimer); lTimer = win.setTimeout(() => render(false), 200); } return; }
    if (ds.mf) { mp[ds.mf] = ev.target.value; mp.limit = 150; win.clearTimeout(lTimer); lTimer = win.setTimeout(() => render(false), 250); return; }
    const k = ds.f; if (!k) return;
    st.f[k] = ev.target.value.trim();
    if (k === "author") call("uiAuthors", JSON.stringify(st.f.author));
    win.clearTimeout(fTimer); fTimer = win.setTimeout(() => search(), 400);
  });
  const isTextInput = el => !!el && !!el.tagName && (el.tagName === "TEXTAREA"
    || (el.tagName === "INPUT" && ["text", "number", "password", "search", ""].includes(String(el.type || "").toLowerCase())));
  let typing = false;
  function typingOn() { if (!typing) { typing = true; lua("setCEFTyping(true)"); } }
  function typingOff() { if (typing) { typing = false; lua("setCEFTyping(false)"); } }
  root.addEventListener("focusin", ev => { if (isTextInput(ev.target)) typingOn(); });
  root.addEventListener("focusout", ev => {
    if (!isTextInput(ev.target)) return;
    // focus moving straight into another of our text inputs: stay in typing mode
    const nx = ev.relatedTarget; if (nx && root.contains(nx) && isTextInput(nx)) return;
    // decide after the event settles: a re-render or a focus() into another field must not drop typing
    win.setTimeout(() => { const ae = doc.activeElement; if (!(ae && root.contains(ae) && isTextInput(ae))) typingOff(); }, 0);
  });
  // clicking an input that already has DOM focus (e.g. after the game took the keyboard back) re-enables typing
  root.addEventListener("mousedown", ev => { if (isTextInput(ev.target) && doc.activeElement === ev.target) typingOn(); }, true);
  // Escape in any text field: leave the field (releases the keyboard) instead of closing everything
  root.addEventListener("keydown", ev => { if (ev.key === "Escape" && isTextInput(ev.target) && ev.target !== qIn) { ev.target.blur(); } }, true);
  function cefTypingLost() { typing = false; try { const a = doc.activeElement; if (a && root.contains(a) && isTextInput(a)) a.blur(); } catch (e) { } } /* ignore */
  qIn.addEventListener("keydown", ev => { ev.stopPropagation(); if (ev.key === "Enter") search(false); if (ev.key === "Escape") { qIn.blur(); close(); } });
  qIn.addEventListener("keyup", ev => ev.stopPropagation());
  root.querySelector(".search").addEventListener("mousedown", ev => { if (ev.target !== qIn) { ev.preventDefault(); qIn.focus(); } });
  qIn.addEventListener("input", () => { win.clearTimeout(typeTimer); typeTimer = win.setTimeout(() => { if (qIn.value.trim().length >= 2) search(false); }, 450); });
  doc.addEventListener("keydown", ev => {
    if (root.classList.contains("open") && st.view === "results" && !ev.ctrlKey && !ev.altKey && !ev.metaKey && /^[1-4]$/.test(ev.key) && !(ev.target.matches && ev.target.matches("input,textarea,select"))) {
      setView(VIEWS[+ev.key - 1][0]); ev.preventDefault(); return;
    }
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.closest && ev.target.closest("#rfm [tabindex='0'][data-a]") && !(ev.target.matches && ev.target.matches("input,textarea,select"))) { ev.preventDefault(); ev.target.click(); return; }
    if ((ev.key === "ArrowLeft" || ev.key === "ArrowRight") && root.classList.contains("open") && st.view === "library" && lib.drawer && !(ev.target.matches && ev.target.matches("input,textarea,select"))) {
      const imgs = drawerImages(byName(lib.drawer) || {}); if (imgs.length > 1) { lib.shot = (lib.shot + (ev.key === "ArrowRight" ? 1 : -1) + imgs.length) % imgs.length; render(false); } return;
    }
    if (ev.key !== "Escape" || !root.classList.contains("open")) return;
    if (st.confirm) { st.confirm = null; render(false); return; }
    if (st.view === "servers" && mp.detail) { mp.detail = null; render(false); return; }
    if (st.view === "library" && lib.tour != null) { tourDone(); render(false); return; }
    if (st.view === "library" && (lib.edit || lib.loEdit)) { lib.edit = null; lib.loEdit = null; render(false); return; }
    if (st.view === "library" && lib.drawer) { lib.drawer = null; render(false); return; }
    if (st.view === "library" && lib.cmp != null) { lib.cmp = null; render(false); return; }
    if (lib.tagEdit) return;
    st.view === "detail" ? go(st.prev || "home") : close();
  });

  const handlers = {
    MarketplaceModHello: d => { st.hello = d;
      if (d && d.oldRepoFinder && !st.oldWarned) { st.oldWarned = true; notify("error", "The old RepoFinder.zip is still in your mods folder. Marketplace replaces it: disable or delete RepoFinder.zip so they don't both run (your data carries over)."); } },
    MarketplaceModHome: d => { const first = !st.home; st.home = d; if (d.catalog) st.catalog = d.catalog; if (st.heroIdx >= toArr(st.home.hero).length) st.heroIdx = 0;
      if (first || !st.top || st.top.mode !== "snapshots") call("uiTop", JSON.stringify(st.period)); return st.view !== "home"; },
    MarketplaceModTop: d => { if (d.period === st.period) st.top = d; return st.view !== "home"; },
    MarketplaceModResults: d => { if (d.reqId === st.reqId || d.reqId == null) { st.results = d; st.loadingMore = false; if (d.catalog) st.catalog = d.catalog; } return st.view !== "results"; },
    MarketplaceModDownloads: () => false,
    MarketplaceModInstalled: d => { st.inst = d; st.installed = new Set(toArr(d.ids).map(String)); dl.markInstalled(d.ids); return false; },
    MarketplaceModAuthors: d => { if (d.prefix === st.f.author) st.authors = d; return st.view !== "results"; },
    MarketplaceModCatalog: d => { st.catalog = d; updateCatalog(); return true; },
    MarketplaceModDetail: d => { if (d.removed) { st.subscribed.delete(d.id); st.detail = d; return st.view !== "detail"; } if (!st.detail || !d.partial) st.detail = d; return st.view !== "detail"; },
    MarketplaceModInstallPlan: d => { st.planFor = null; showInstallPlan(d); return false; },
    MarketplaceModSubscribed: d => { if (!d.ok) st.subscribed.delete(d.id); },
    MarketplaceModToggle: () => { toggle(); return true; },
    __lib: () => st.view !== "library",
    MarketplaceModLibrary: d => { lib.data = d; const names = new Set(toArr(d.mods).map(r => r.name)); for (const n of [...lib.sel]) if (!names.has(n)) lib.sel.delete(n);
      if (lib.drawer && !names.has(lib.drawer)) lib.drawer = null;
      if (!lib.keepInit && d.settings) { lib.keepInit = true; lib.keep = +d.settings.keepVersions || 1; }
      applyAccent();
      if (st.view === "library" && !lib.autoChecked && d.settings && d.settings.autoCheck !== false) { lib.autoChecked = true; lib.upd.checking = true; lib.upd.checked = 0; libCall("uiCheckUpdates"); }
      return st.view !== "library"; },
    MarketplaceModLoadoutCheck: d => { showLoadoutCheck(d); return false; },
    MarketplaceModChangelog: d => { const x = d.data; lib.upd.log[d.id] = x && x.text ? String(x.text).replace(/\[\/?[a-zA-Z0-9=#*"' ]+\]/g, "").slice(0, 1500) : "No changelog available."; return st.view !== "library"; },
    MarketplaceModBackup: d => { lib.backupPath = d.path; lib.backupText = d.text; notify("info", d.path ? "Backup saved: " + d.path : "Backup created"); return st.view !== "library"; },
    MarketplaceModBackupFiles: d => { lib.backups = toArr(d.files); return st.view !== "library"; },
    MarketplaceModHealth: d => { lib.health = d; return st.view !== "library"; },
    MarketplaceModLibMsg: d => { lib.msg = d; notify(d.type, d.msg); if (toArr(d.missing).length && d.missing && toArr(d.missing)[0] && typeof toArr(d.missing)[0] === "object") lib.missing = toArr(d.missing); return false; },
    MarketplaceModLoadoutExport: d => { lib.exportText = d.text || JSON.stringify(d.data || {}, null, 1); lib.exportPath = d.path; return st.view !== "library"; },
    MarketplaceModPackExport: d => { lib.packExport = d; if (d.ok) notify("info", "Saved " + d.file + " · use Open folder to share it"); return st.view !== "library"; },
    MarketplaceModPackFiles: d => { lib.packFiles = d;
      if (lib.pkJump) { lib.pkJump = false; setTimeout(() => { const e = document.querySelector('#rfm [data-key="pkimp"]'); if (e) e.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60); }
      return st.view !== "library"; },
    MarketplaceModPackPreview: d => { lib.pack = d; return st.view !== "library"; },
    MarketplaceModLoadoutFiles: d => { lib.files = toArr(d.files); return st.view !== "library"; },
    MarketplaceModServerPacks: d => { lib.spacks = d; if (d.keep) { mp.prefs = mp.prefs || { fav: {}, recent: [] }; mp.prefs.keep = d.keep; } return st.view !== "library"; },
    MarketplaceModServers: d => { if (d.launcher != null) mp.launcher = d.launcher; mp.prefs = { fav: d.fav || {}, recent: toArr(d.recent), keep: d.keep || (mp.prefs && mp.prefs.keep) || {} };
      if (!toArr(d.servers).length) {
        if (mp.data && mp.src === "js") { mp.data.fav = mp.prefs.fav; mp.data.recent = mp.prefs.recent; }
        if (d.error && !mp.data) { fetchServersJS(); if (!d.loading) { mp.err = d.error; } }
        return st.view !== "servers"; }
      mp.src = "lua"; mp.err = null; mp.data = d; return st.view !== "servers"; },
    onBeamMPServerListReceived: d => { if (mp.data && mp.src === "lua") return true; acceptRawServers(d); return st.view !== "servers"; },
    MarketplaceModServer: d => { if (mp.detail && mp.detail.key === d.key) mp.detail = d; return st.view !== "servers"; },
    MarketplaceModJoin: d => onJoinState(d),
    LoadingInfo: d => onJoinLoading(d),
    onBeamMPDownloadSecurityPrompt: () => onJoinPrompt(), DownloadSecurityPrompt: () => onJoinPrompt(),
    onBeamMPServerJoined: () => onJoined(), onServerJoined: () => onJoined(),
    onBeamMPLauncherConnectionLost: () => onJoinLost(),
    onBeamMPLoggedIn: () => onLoggedIn(), onBeamMPLoginError: d => onLoginError(d),
  };
  // events are batched (~250 ms) and identical payloads are ignored, then one render patches the DOM
  const queued = new Map(), lastSig = new Map();
  const JOIN_EVENTS = new Set(["MarketplaceModJoin", "LoadingInfo", "onBeamMPDownloadSecurityPrompt", "DownloadSecurityPrompt", "onBeamMPServerJoined", "onServerJoined", "onBeamMPLauncherConnectionLost", "onBeamMPLoggedIn", "onBeamMPLoginError"]);
  let flushTimer = null;
  function flush() {
    flushTimer = null;
    try {
      for (const [name, d] of queued) {
        if (!d || typeof d !== "object") continue;
        if (name === "MarketplaceModHome") { rememberTitles(d.hero); rememberTitles(d.forYou); rememberTitles(d.recent); toArr(d.shelves).forEach(s => s && rememberTitles(s.items)); }
        else if (name === "MarketplaceModResults" || name === "MarketplaceModTop") rememberTitles(d.items);
        else if (name === "MarketplaceModDetail" && d.item) rememberTitles([d.item]);
      }
    } catch (e) { } /* titles are cosmetic */
    let needRender = false;
    try { if (dl.tick()) needRender = true; if (dl.unseen(0).length) queueCheck(UNSEEN_MS); } catch (e) { } /* ignore */
    for (const [name, data] of queued) {
      let skip = true;
      try { skip = handlers[name](data); } catch (e) { console.error("Marketplace event " + name, e); }
      if (!skip) needRender = true;
    }
    queued.clear();
    if (needRender && root.classList.contains("open")) render(false);
  }
  let modsT = null;
  // ---- failed subscriptions / downloads ----
  const UNSEEN_MS = 20000;
  let qcT = null, qcAsk = 0, qcErr = false, qcWait = null;
  function queueCheck(delay, afterError) {
    if (afterError) qcErr = true;
    if (qcT) { if (!afterError) return; win.clearTimeout(qcT); }
    qcT = win.setTimeout(() => {
      qcT = null; qcAsk = Date.now(); call("uiQueueCheck");
      win.clearTimeout(qcWait);
      qcWait = win.setTimeout(() => { if (qcAsk) { qcAsk = 0; applyQueueCheck(null); } }, 5000);
    }, delay);
  }
  function failReason() {
    const e = st.repoErr;
    if (e && Date.now() - e.t < 120000 && e.from === "toastrMsg") return "The download failed (" + e.msg.replace(/\s*\(Check console for details\)/i, "") + "). Try again.";
    return e && Date.now() - e.t < 120000 ? "The repository refused it (" + e.msg + "). Try again in a moment."
      : "The download never started: the game's repository queue doesn't have it (is the game online?). Try again.";
  }
  function applyQueueCheck(q) {
    const listed = q ? new Set([...toArr(q.updatingList), ...toArr(q.doneList), ...toArr(q.missingList)].filter(e => e && e.id != null).map(e => String(e.id))) : null;
    const err = qcErr; qcErr = false;
    let n = 0;
    try { n = dl.failMissing(listed, err ? 1500 : UNSEEN_MS, failReason(), err); } catch (e) { console.error("Marketplace downloads", e); }
    if (n) { queued.set("MarketplaceModDownloads", null); if (!flushTimer) flushTimer = win.setTimeout(flush, 250); console.warn("Marketplace: " + n + " repository download(s) marked failed: " + failReason()); }
    if (dl.unseen(0).length) queueCheck(UNSEEN_MS);
  }
  function onRepoFailure(name, d) {
    const msg = (typeof d === "string" ? d : String((d && (d.msg || d.message || d.text)) || "")).trim() || "Server Error";
    st.repoErr = { msg, t: Date.now(), from: name };
    const m = /\(([A-Za-z0-9_-]+)\)\s*$/.exec(msg); // "Server Error : <message> (<mod id>)"
    if (m && dl.get(m[1])) { dl.update([{ id: m[1], state: "failed", error: "The repository refused it: " + msg.replace(/\s*\([^)]*\)\s*$/, "") }]); queued.set("MarketplaceModDownloads", null); }
    queueCheck(1500, true);
  }
  function onGameEvent(name, data) {
    const d = normalize(data);
    if (name === "repoError" || name === "modmanagerError") onRepoFailure(name, data);
    else if (name === "toastrMsg") { if (d && d.type === "error" && /repo/i.test(String(d.title || ""))) onRepoFailure(name, d); }
    if (name === "UpdateQueueState" && d && typeof d === "object") {
      lib.upd.queue = d;
      const run = lib.upd.run;
      if (run && run.cur != null) {
        const doneNow = toArr(d.doneList).some(e => e && String(e.id) === String(run.cur));
        const e = toArr(d.updatingList).find(x => x && String(x.id) === String(run.cur));
        if (doneNow || !e || Date.now() - run.t > 300000) nextUpdate();
      }
      if (st.view === "library") queued.set("__lib", null);
    }
    if (name === "UpdateFinished" && lib.upd.run) { lib.upd.run.i = lib.upd.run.ids.length; nextUpdate(); }
    if (name === "checkUpdateCheckedMod") { lib.upd.checking = true; lib.upd.checked++; lib.upd.last = String(d || ""); queued.set("__lib", null); }
    if (name === "checkingUpdatesEnd") { lib.upd.checking = false; queued.set("__lib", null); }
    if (name === "UpdateFinished" || name === "ModUnsubscribed" || name === "ModManagerModsChanged" || name === "ModManagerReady") {
      win.clearTimeout(modsT); modsT = win.setTimeout(() => { call("uiInstalled"); if (st.view === "library") libCall("uiLibrary"); if (st.view === "library" && lib.page === "loadouts" && lib.spacks) mpCall("uiServerPacks"); }, 400);
    }
    if (name === "ModListReceived" || name === "MyModsReceived" || name === "ModReceived") {
      const items = d && (Array.isArray(d.data) || (d.data && typeof d.data === "object" && !d.data.tagid)) ? toArr(d.data) : d && d.data ? [d.data] : [];
      for (const m of items) if (m && m.tagid != null && m.sub) st.subscribed.add(String(m.tagid));
    }
    if (name === "ModSubscribed") { const md = d && (d.modData || d); if (md && (md.tagid || md.id)) st.subscribed.add(String(md.tagid || md.id)); }
    const list = normalizeGameEvent(name, d);
    if (list.length) { list.forEach(x => { x.game = true; }); try { dl.update(list); } catch (e) { console.error("Marketplace downloads", e); } queued.set("MarketplaceModDownloads", null); }
    if (name === "UpdateQueueState" && qcAsk && d && typeof d === "object") { qcAsk = 0; win.clearTimeout(qcWait); applyQueueCheck(d); }
    if (queued.size) { if (opts.sync) flush(); else if (!flushTimer) flushTimer = win.setTimeout(flush, 250); }
  }
  const onGameDownload = onGameEvent;
  function onEvent(name, data) {
    if (name === "CEFTypingLostFocus") { cefTypingLost(); return; }
    const h = handlers[name]; if (!h) return;
    const d = normalize(data);
    if (name === "MarketplaceModToggle") { h(d); return; }
    if (JOIN_EVENTS.has(name)) { let skip = true; try { skip = h(typeof data === "string" ? data : d); } catch (e) { console.error("Marketplace event " + name, e); } if (!skip && isOpen()) render(false); return; }
    if (name === "MarketplaceModDownloads") { // apply every update (several sources may report in one batch)
      try { dl.update(normalizeDownloads(d)); } catch (e) { console.error("Marketplace downloads", e); }
      queued.set(name, null);
      if (opts.sync) flush(); else if (!flushTimer) flushTimer = win.setTimeout(flush, 250);
      return;
    }
    let sig; try { sig = JSON.stringify(d); } catch (e) { sig = Math.random(); }
    if (lastSig.get(name) === sig && name !== "MarketplaceModSubscribed" && name !== "MarketplaceModLibMsg") return;
    lastSig.set(name, sig);
    queued.set(name, d);
    if (opts.sync) flush(); else if (!flushTimer) flushTimer = win.setTimeout(flush, 250);
  }
  const events = Object.keys(handlers).filter(n => !n.startsWith("__"));
  return { events, open, close, isOpen, toggle, onEvent, onGameEvent, onGameDownload, downloads: dl, flush, state: st, render, go };
}

// ---- registration with BeamNG's AngularJS UI ----
export const REPO_STATE = "menu.mods.repository";
export const GAME_DOWNLOAD_EVENTS = ["downloadStatesChanged", "downloadStateChanged", "UpdateQueueState", "RepoModChangeStatus",
  "ModDownloaded", "ModSubscribed", "OnlineRequestsState"];
export const GAME_REPO_EVENTS = ["ModListReceived", "ModReceived", "MyModsReceived", "ModUnsubscribed", "UpdateFinished",
  "checkUpdateCheckedMod", "checkingUpdatesEnd",
  "repoError", "toastrMsg", "modmanagerError"];
export const GAME_MODS_EVENTS = ["ModManagerModsChanged", "ModManagerReady"];
export const FALLBACK_STATES = ["menu.mods.local", "menu.mods", "menu.mainmenu", "menu"];
const OVERRIDDEN = new Set();

export function installStateOverride($rootScope, $injector, cfg, flags) {
  const STATE = cfg.state, view = cfg.view;
  OVERRIDDEN.add(STATE);
  const isMine = s => !!s && (s.name || s) === STATE;
  const isTaken = s => !!s && OVERRIDDEN.has(s.name || s);
  const get = n => { try { return $injector.has && !$injector.has(n) ? null : $injector.get(n); } catch (e) { return null; } };
  const later = f => { const $t = get("$timeout"); $t ? $t(f, 0) : setTimeout(f, 0); };
  let back = null; // { name, params } of the state the user came from
  let leaving = false; // our own navigation in progress
  let engaged = false; // overlay is currently standing in for STATE
  const usable = st => { if (!st || !st.name || isTaken(st) || st.abstract) return false;
    const $state = get("$state"); if (!$state || !$state.get) return true; const d = $state.get(st.name); return !!d && !d.abstract; };
  const remember = (from, params) => { back = usable(from) ? { name: from.name, params: params || {} } : null; };
  const engage = () => { engaged = true; cfg.open(); };

  function exit() {
    if (!engaged) return;
    engaged = false;
    const $state = get("$state"); if (!$state) return;
    const target = back || null; back = null;
    const atClose = $state.current && $state.current.name;
    let navigatedElsewhere = false;
    const off = $rootScope.$on("$stateChangeStart", () => { navigatedElsewhere = true; });
    // after the cancelled transition has fully unwound, go somewhere real
    later(() => {
      if (typeof off === "function") off();
      const cur = $state.current && $state.current.name;
      if (navigatedElsewhere || ($state.transition && !leaving) || cur !== atClose) return; // the game's own Back already moved
      const cands = (target ? [target] : []).concat((cfg.fallbacks || FALLBACK_STATES).map(name => ({ name, params: {} })));
      for (const c of cands) {
        if (!usable({ name: c.name })) continue;
        leaving = true;
        try {
          // reload when re-entering the page we're on so a half-torn view gets rebuilt
          const p = $state.go(c.name, c.params, { reload: cur === c.name || !cur || isTaken($state.current) });
          const done = () => { leaving = false; };
          p && p.then ? p.then(done, done) : done();
          return;
        } catch (e) { leaving = false; }
      }
    });
  }
  const onOther = toState => {
    if (isTaken(toState)) { engaged = false; return; }
    engaged = false;
    if (!leaving && view.isOpen && view.isOpen()) view.close(true);
  };

  // ui-router 0.x
  $rootScope.$on("$stateChangeStart", (event, toState, toParams, fromState, fromParams) => {
    if (!isMine(toState)) { onOther(toState); return; }
    if (flags.bypass) { flags.bypass = false; return; }
    event.preventDefault();
    remember(fromState, fromParams);
    engage();
  });
  // ui-router 1.x
  const $tr = get("$transitions");
  if ($tr) {
    $tr.onBefore({ to: STATE }, trans => {
      if (flags.bypass) { flags.bypass = false; return true; }
      try { remember(trans && trans.from && trans.from(), trans && trans.params && trans.params("from")); } catch (e) { back = null; }
      engage(); return false;
    });
    if ($tr.onStart) $tr.onStart({}, trans => { try { const to = trans.to(); if (!isMine(to)) onOther(to); } catch (e) { } return true; }); /* ignore */
  }
  // already on the state when we load: take over; closing will leave to a fallback
  try { const $state = get("$state"); if ($state && $state.current && isMine($state.current)) { back = null; engage(); } } catch (e) { } /* ignore */
  return { exit, _back: () => back, engaged: () => engaged };
}

export function installRepoOverride($rootScope, $injector, market, flags) {
  return installStateOverride($rootScope, $injector, { state: REPO_STATE, view: market, open: () => market.open(), fallbacks: FALLBACK_STATES }, flags);
}

if (typeof angular !== "undefined") {
  angular.module("marketplaceMod", []).run(["$rootScope", "$injector", function ($rootScope, $injector) {
    const lua = cmd => { try { bngApi.engineLua(cmd); } catch (e) { console.error("Marketplace", e); } };
    const repoFlags = { bypass: false };
    const goState = (name, flags) => {
      const go = () => { if (flags) flags.bypass = true; try { $injector.get("$state").go(name); } catch (e) { if (flags) flags.bypass = false; console.error("Marketplace", e); } };
      try { $injector.get("$timeout")(go, 0); } catch (e) { setTimeout(go, 0); }
    };
    const start = () => {
      if (window.MarketplaceModMarket || window.RepoFinderMarket || !document.body) return;
      let repoCtl = null, opener = null;
      const mkt = createMarket(document, lua, {
        openClassic: () => goState(REPO_STATE, repoFlags),
        onClose: () => { const c = opener; opener = null; if (c) c.exit(); },
      });
      window.MarketplaceModMarket = mkt;
      window.RepoFinderMarket = mkt;
      ["CEFTypingLostFocus", "MarketplaceModHello", "MarketplaceModHome", "MarketplaceModTop", "MarketplaceModResults", "MarketplaceModDetail", "MarketplaceModSubscribed", "MarketplaceModToggle", "MarketplaceModCatalog", "MarketplaceModAuthors",
        "MarketplaceModDownloads", "MarketplaceModInstalled", "onBeamMPServerListReceived", "MarketplaceModLibrary", "MarketplaceModHealth", "MarketplaceModLibMsg", "MarketplaceModLoadoutExport", "MarketplaceModPackExport", "MarketplaceModPackFiles", "MarketplaceModPackPreview", "MarketplaceModLoadoutFiles"]
        .concat(mkt.events || []).filter((n, i, all) => all.indexOf(n) === i)
        .forEach(n => $rootScope.$on(n, (e, data) => mkt.onEvent(n, data)));
      GAME_DOWNLOAD_EVENTS.concat(GAME_REPO_EVENTS, GAME_MODS_EVENTS).forEach(n => $rootScope.$on(n, (e, data) => mkt.onGameEvent(n, data)));
      try {
        repoCtl = installStateOverride($rootScope, $injector, { state: REPO_STATE, view: mkt, fallbacks: FALLBACK_STATES,
          open: () => { opener = repoCtl; mkt.open("home"); } }, repoFlags);
      } catch (e) { console.error("Marketplace override", e); }
      lua('extensions.load("marketplaceMod"); extensions.load("marketplaceModLib")');
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
  }]);
}
