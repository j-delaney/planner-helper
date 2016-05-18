mkdir -pv build/planner-helper
mkdir -pv build/planner-helper/src/inject
mkdir -pv build/planner-helper/src/bg
mkdir -pv build/planner-helper/icons
mkdir -pv build/planner-helper/js

cp -v manifest.json build/planner-helper/
cp -v icons/* build/planner-helper/icons/
cp -v src/inject/inject.css build/planner-helper/src/inject/
cp -v js/*.min.js build/planner-helper/js/

JS=js/*.js 
BG=src/bg/*.js
INJECT=src/inject/*.js

for f in $FILES $BG $INJECT
do
  uglifyjs -v $f -o build/planner-helper/$f
done

google-chrome --pack-extension=./build/planner-helper/
./createCRX.sh build/planner-helper build/planner-helper.pem

rm -rv build/
