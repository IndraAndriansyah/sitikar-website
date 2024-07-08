#Dockerfiler
FROM python:3.9.17-bookworm

#Allow statements and log messages to immediately appear in the logs
ENV PYTHONUNBUFFERED True

#Copy level code to the container image
ENV APP_HOME /back-end
WORKDIR $APP_HOME
COPY . ./

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt


#Run the web server on container startup. using gunicorn
#webserver, with one worker process and 8 threads
#For env with multiple CPU cores, increase the number of workers
#to be equal to the cores available 
# Timeout is set to 0 to disable the timeouts of the workers to allow Cloud Run to handle instance scalling
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app