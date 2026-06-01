# Instructions

## First of all be sure that I'm on the right path:
cd C:\scripts

## Cuando se hace un cambio en package.json (to unlink by package name):
npm unlink -g genprompt
(p/ deslinkearlo globalmente, se hace a genprompt xq así se llama todo el paquete, donde están incluidos todos los scripts)

## To check what's linked (if I want, before and after every change):
npm ls -g --depth=0 --link=true

## Link the package (this registers all bin commands)
npm link

## Now test your commands
genprompt
copyfiles
genprompte