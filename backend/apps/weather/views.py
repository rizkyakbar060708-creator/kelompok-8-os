import logging

from rest_framework.response import Response
from rest_framework.views import APIView

from .services import WeatherError, get_weather

logger = logging.getLogger(__name__)


def _error_response(exc):
    # Detail teknis (URL BMKG, exception, traceback) hanya masuk log server.
    logger.warning("Weather request failed: %s (%s)", exc.code, exc.detail)
    return Response(
        {"error": {"code": exc.code, "message": exc.message}},
        status=exc.status_code,
    )


class WeatherView(APIView):
    """Payload lengkap: lokasi, current, hourly, daily, source."""

    def get(self, request):
        try:
            data = get_weather()
        except WeatherError as exc:
            return _error_response(exc)

        return Response(data)


class WeatherCurrentView(APIView):
    def get(self, request):
        try:
            data = get_weather()
        except WeatherError as exc:
            return _error_response(exc)

        return Response(
            {
                "location": data["location"],
                "current": data["current"],
                "source": data["source"],
            }
        )


class WeatherForecastView(APIView):
    def get(self, request):
        try:
            data = get_weather()
        except WeatherError as exc:
            return _error_response(exc)

        return Response(
            {
                "location": data["location"],
                "hourly": data["hourly"],
                "daily": data["daily"],
                "source": data["source"],
            }
        )
