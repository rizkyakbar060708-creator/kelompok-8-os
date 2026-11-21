from django.urls import path

from .views import WeatherCurrentView, WeatherForecastView, WeatherView


urlpatterns = [
    path("", WeatherView.as_view(), name="weather-overview"),
    path("current/", WeatherCurrentView.as_view(), name="weather-current"),
    path("forecast/", WeatherForecastView.as_view(), name="weather-forecast"),
]
