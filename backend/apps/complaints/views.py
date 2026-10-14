from rest_framework import generics

from .models import Complaint
from .serializers import ComplaintSerializer


class ComplaintListCreateView(generics.ListCreateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer

    # reporter tidak pernah diambil dari payload client, selalu dari session.
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class ComplaintDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
