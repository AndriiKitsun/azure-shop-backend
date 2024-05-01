#!/bin/sh

APP_NAME="fa-products-service-ne-ak001"
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_DIR="package"

echo "Deployment of '$PACKAGE_NAME' initiated"

if [ -d $PACKAGE_DIR ]; then
  echo "Directory '$PACKAGE_DIR' already exists. Deleting..."
  rimraf $PACKAGE_DIR
  echo "Deleted"
fi

echo "Preparing package for deployment..."
mkdir $PACKAGE_DIR
npm run build
cp -a dist package.json package-lock.json host.json local.settings.json .funcignore package
cd package
npm install --omit=dev
echo "Package has been prepared"

echo "Deploying..."
func azure functionapp publish $APP_NAME

echo "Done"
