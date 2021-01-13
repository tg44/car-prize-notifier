#/bin/sh

cd ses-bounce-delivery
npm i
zip -r ../ses-bounce-delivery.zip *

cd sqs-to-ses
#npm i
zip -r ../sqs-to-ses.zip *

cd api-to-sqs
#npm i
zip -r ../api-to-sqs.zip *
