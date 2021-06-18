rm -rf .env
touch .env
rm -rf ~/.astrarc
touch ~/.astrarc
echo "[default]" >> ~/.astrarc
echo "Please paste the export block from the connect page here:"
while :
do 
 read line
 [[ $line =~ .*app_token.* ]]&& break
 echo "${line#export }" >> .env
 echo "${line#export }" >> ~/.astrarc
 `$line`
done
echo "Please enter your application token"
read token
echo "ASTRA_DB_APPLICATION_TOKEN=$token" >> ~/.astrarc
echo "ASTRA_DB_TOKEN=0" >> ~/.astrarc
echo "ASTRA_DB_TOKEN_TIME=0" >> ~/.astrarc
echo "ASTRA_DB_APPLICATION_TOKEN=$token" >> .env